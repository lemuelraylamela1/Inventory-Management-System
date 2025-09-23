import { NextResponse } from "next/server";
import PurchaseOrder from "@/models/purchaseOrder";
import PurchaseReceipt from "@/models/purchaseReceipt";

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

    await PurchaseReceipt.updateOne(
      { prNumber },
      {
        $set: {
          status: "RECEIVED",
          locked: true,
        },
      }
    );

    await PurchaseOrder.updateMany(
      { poNumber: { $in: poNumbers } },
      {
        $set: {
          status: "COMPLETED",
          locked: true,
        },
      }
    );

    console.log(
      `✅ PR ${prNumber} posted. Linked POs marked as COMPLETED and locked.`
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error posting receipt:", error);
    return NextResponse.json(
      { error: "Failed to post receipt" },
      { status: 500 }
    );
  }
}
