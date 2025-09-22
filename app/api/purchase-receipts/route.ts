import { NextResponse } from "next/server";
import PurchaseOrder from "@/models/purchaseOrder";
import PurchaseReceipt, { ReceiptItem } from "@/models/purchaseReceipt";
import { generateNextPRNumber } from "../../../libs/generateNextPRNumbers";

type POItem = {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitType: string;
  purchasePrice: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const poNumbers = Array.isArray(body.poNumber)
      ? body.poNumber.map((po: string) => po.trim().toUpperCase())
      : [];

    if (poNumbers.length === 0) {
      return NextResponse.json(
        { error: "At least one PO number is required" },
        { status: 400 }
      );
    }

    const purchaseOrders = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });

    if (purchaseOrders.length === 0) {
      return NextResponse.json(
        { error: "No matching purchase orders found" },
        { status: 404 }
      );
    }

    const completedPOs = purchaseOrders.filter(
      (po) => po.status === "COMPLETED"
    );

    if (completedPOs.length > 0) {
      const completedNumbers = completedPOs.map((po) => po.poNumber).join(", ");
      return NextResponse.json(
        {
          error: `Cannot create receipt: the following PO(s) are already completed — ${completedNumbers}`,
        },
        { status: 400 }
      );
    }

    const selectedItems: ReceiptItem[] = Array.isArray(body.items)
      ? (body.items
          .filter(
            (item: Partial<ReceiptItem> & { selected?: boolean }) =>
              item?.selected
          )
          .map((item: Partial<ReceiptItem>) => {
            const quantity = Number(item.quantity);
            const purchasePrice = Number(item.purchasePrice);

            return {
              itemCode: item.itemCode?.trim().toUpperCase() || "",
              itemName: item.itemName?.trim() || "",
              quantity,
              unitType: item.unitType?.trim().toUpperCase() || "",
              purchasePrice,
              amount: quantity * purchasePrice,
            };
          })
          .filter(Boolean) as ReceiptItem[])
      : [];

    if (selectedItems.length === 0) {
      return NextResponse.json(
        { error: "No items were selected for receipt creation" },
        { status: 400 }
      );
    }

    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalQuantity = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const updatedPOs: {
      poNumber: string;
      balance: number;
      status: string;
      totalQuantity: number;
    }[] = [];

    for (const po of purchaseOrders) {
      let mutated = false;
      let totalDeducted = 0;

      if (typeof po.balance !== "number") {
        po.balance = po.total;
      }

      for (const receiptItem of selectedItems) {
        const poItem = po.items.find(
          (i: POItem) =>
            i.itemCode?.trim().toUpperCase() ===
            receiptItem.itemCode?.trim().toUpperCase()
        );

        if (poItem) {
          poItem.quantity = Math.max(poItem.quantity - receiptItem.quantity, 0);
          totalDeducted += receiptItem.amount;
          mutated = true;
        }
      }

      po.balance = Math.max(po.balance - totalDeducted, 0);
      po.items = po.items.filter((i: POItem) => i.quantity > 0);
      po.totalQuantity = po.items.reduce(
        (sum: number, item: POItem) => sum + item.quantity,
        0
      );

      let newStatus = po.status;

      if (po.items.length === 0 && po.balance === 0) {
        newStatus = "COMPLETED";
        await PurchaseOrder.updateOne(
          { _id: po._id },
          {
            $set: {
              items: [],
              status: newStatus,
              total: po.total,
              balance: 0,
              totalQuantity: 0,
            },
          }
        );
        console.log(
          `📦 PO ${po.poNumber} marked as Completed and items cleared`
        );
      } else if (mutated) {
        newStatus = "PARTIAL";
        await PurchaseOrder.updateOne(
          { _id: po._id },
          {
            $set: {
              items: po.items,
              status: newStatus,
              total: po.total,
              balance: po.balance,
              totalQuantity: po.totalQuantity,
            },
          }
        );
        console.log(
          `🟡 PO ${po.poNumber} marked as Partial with remaining items`
        );
      }

      const refreshedPO = await PurchaseOrder.findOne({
        poNumber: po.poNumber,
      }).select("poNumber balance status totalQuantity");

      if (refreshedPO) {
        updatedPOs.push({
          poNumber: refreshedPO.poNumber,
          balance: refreshedPO.balance,
          status: refreshedPO.status,
          totalQuantity: refreshedPO.totalQuantity,
        });
      }
    }

    const newReceipt = await PurchaseReceipt.create({
      prNumber: await generateNextPRNumber(),
      supplierInvoiceNum: body.supplierInvoiceNum?.trim().toUpperCase(),
      poNumber: poNumbers,
      supplierName:
        purchaseOrders[0]?.supplierName?.trim().toUpperCase() || "UNKNOWN",
      warehouse:
        purchaseOrders[0]?.warehouse?.trim().toUpperCase() || "UNKNOWN",
      amount: totalAmount,
      quantity: totalQuantity,
      status: body.status || "RECEIVED",
      remarks: body.remarks?.trim() || "",
      items: selectedItems,
    });

    return NextResponse.json(
      {
        receipt: newReceipt,
        updatedPurchaseOrders: updatedPOs,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating receipt:", error);
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const receipts = await PurchaseReceipt.find().sort({ createdAt: -1 });
    return NextResponse.json(receipts, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to retrieve receipts" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = await PurchaseReceipt.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Receipt deleted", id },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ Error deleting receipt:", error);
    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const poNumbers = Array.isArray(body.poNumber)
      ? body.poNumber.map((po: string) => po.trim().toUpperCase())
      : [];

    const purchaseOrders = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });

    if (purchaseOrders.length === 0) {
      return NextResponse.json(
        { error: "No matching purchase orders found" },
        { status: 404 }
      );
    }

    const supplierName =
      purchaseOrders[0]?.supplierName?.trim().toUpperCase() || "UNKNOWN";
    const warehouse =
      purchaseOrders[0]?.warehouse?.trim().toUpperCase() || "UNKNOWN";
    const amount = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

    const updated = await PurchaseReceipt.findByIdAndUpdate(
      id,
      {
        supplierInvoiceNum: body.supplierInvoiceNum?.trim().toUpperCase(),
        poNumber: poNumbers,
        supplierName,
        warehouse,
        amount,
        status: body.status?.trim().toLowerCase() || "draft",
        remarks: body.remarks?.trim() || "", // ✅ Add this line
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error updating receipt:", error);
    return NextResponse.json(
      { error: "Failed to update receipt" },
      { status: 500 }
    );
  }
}
