import { NextResponse } from "next/server";
import PurchaseOrder from "@/models/purchaseOrder";
import PurchaseReceipt from "@/models/purchaseReceipt";
import { ReceiptItem } from "@/app/components/sections/type";

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
      const originalBalance =
        typeof po.balance === "number" ? po.balance : po.total;
      let totalDeducted = 0;

      const remainingItems = po.items.filter((poItem: POItem) => {
        const matched = receipt.items.find(
          (receiptItem: ReceiptItem) =>
            receiptItem.itemCode?.trim().toUpperCase() ===
            poItem.itemCode?.trim().toUpperCase()
        );

        if (matched) {
          totalDeducted += matched.amount;
          return false; // remove this item
        }

        return true; // keep this item
      });

      const newBalance = Math.max(originalBalance - totalDeducted, 0);
      const newStatus = newBalance === 0 ? "COMPLETED" : "PARTIAL";

      await PurchaseOrder.updateOne(
        { _id: po._id },
        {
          $set: {
            items: remainingItems,
            balance: newBalance,
            status: newStatus,
            totalQuantity: remainingItems.reduce(
              (sum: number, item: POItem) => sum + item.quantity,
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
