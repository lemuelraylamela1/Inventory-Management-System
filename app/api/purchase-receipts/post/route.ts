import { NextResponse } from "next/server";
import PurchaseOrder from "@/models/purchaseOrder";
import PurchaseReceipt from "@/models/purchaseReceipt";
import { ReceiptItem } from "@/app/components/sections/type";
import { PurchaseOrderItem } from "@/app/components/sections/type";

async function reconcilePOWithReceipt(
  po: {
    _id: string;
    poNumber: string;
    items: PurchaseOrderItem[];
    balance?: number;
    total?: number;
  },
  receiptItems: ReceiptItem[]
) {
  const originalBalance =
    typeof po.balance === "number" ? po.balance : po.total ?? 0;
  const totalDeducted = 0;

  const updatedItems = po.items.map((poItem) => {
    const matched = receiptItems.find(
      (receiptItem) =>
        receiptItem.itemCode?.trim().toUpperCase() ===
        poItem.itemCode?.trim().toUpperCase()
    );

    if (matched) {
      const remainingQuantity = Math.max(poItem.quantity - matched.quantity, 0);
      return {
        itemCode: poItem.itemCode,
        itemName: poItem.itemName,
        quantity: remainingQuantity,
        unitType: poItem.unitType,
        purchasePrice: poItem.purchasePrice,
      };
    }

    return poItem;
  });
  const sanitizedItems = updatedItems.map(({ amount, ...rest }) => rest);
  const filteredItems = updatedItems.filter((item) => item.quantity > 0);
  const newBalance = Math.max(originalBalance - totalDeducted, 0);
  const newStatus = newBalance === 0 ? "COMPLETED" : "PARTIAL";

  console.log("🛠️ Writing updated items:", sanitizedItems);

  await PurchaseOrder.updateOne(
    { _id: po._id },
    {
      $set: {
        items: sanitizedItems,
        balance: newBalance,
        status: newStatus,
        totalQuantity: filteredItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
        locked: newStatus === "COMPLETED",
      },
    }
  );

  console.log(
    `📦 PO ${po.poNumber} updated — Status: ${newStatus}, Deducted: ${totalDeducted}, Remaining balance: ${newBalance}`
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prNumber = body.prNumber?.trim().toUpperCase();
    const poNumbers = Array.isArray(body.poNumber)
      ? body.poNumber.map((po: string) => po.trim().toUpperCase())
      : [];

    if (!prNumber || poNumbers.length === 0) {
      return NextResponse.json(
        { error: "Missing PR number or PO numbers" },
        { status: 400 }
      );
    }

    const receipt = await PurchaseReceipt.findOne({ prNumber });
    if (!receipt) {
      return NextResponse.json(
        { error: `Receipt ${prNumber} not found` },
        { status: 404 }
      );
    }

    await PurchaseReceipt.updateOne(
      { prNumber },
      {
        $set: {
          status: "RECEIVED",
          locked: true,
        },
      }
    );

    const purchaseOrders = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });
    for (const po of purchaseOrders) {
      await reconcilePOWithReceipt(po, receipt.items ?? []);
    }

    console.log(`✅ Receipt ${prNumber} posted and linked POs updated.`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error posting receipt:", error);
    return NextResponse.json(
      { error: "Failed to post receipt" },
      { status: 500 }
    );
  }
}
