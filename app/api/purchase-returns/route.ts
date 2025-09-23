import { NextResponse } from "next/server";
import PurchaseReceipt from "@/models/purchaseReceipt";
import PurchaseReturn from "@/models/purchaseReturn";
import { generateNextReturnNumber } from "@/libs/generateNextReturnNumber";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prNumber = body.prNumber?.trim().toUpperCase();
    const reason = body.reason?.trim();
    const notes = body.notes?.trim();
    const status = body.status?.trim().toUpperCase();

    if (!prNumber || !reason) {
      return NextResponse.json(
        { error: "PR number and reason are required." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["OPEN", "APPROVED", "REJECTED", "CLOSED"];
    const normalizedStatus = allowedStatuses.includes(status) ? status : "OPEN"; // default fallback

    const receipt = await PurchaseReceipt.findOne({ prNumber });

    if (!receipt) {
      return NextResponse.json(
        { error: `No purchase receipt found for PR number ${prNumber}.` },
        { status: 404 }
      );
    }

    let returnNumber = "PRTN0000000001"; // fallback
    try {
      returnNumber = await generateNextReturnNumber();
    } catch (err) {
      console.warn("⚠️ Failed to generate return number, using fallback.");
    }

    const newReturn = await PurchaseReturn.create({
      returnNumber,
      prNumber,
      supplierName: receipt.supplierName?.trim().toUpperCase() || "UNKNOWN",
      reason,
      notes,
      status: normalizedStatus,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        return: newReturn,
        items: receipt.items || [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating purchase return:", error);
    return NextResponse.json(
      { error: "Failed to create purchase return." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const returns = await PurchaseReturn.find().sort({ createdAt: -1 });
    return NextResponse.json(returns, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching purchase returns:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchase returns" },
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
    const deleted = await PurchaseReturn.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Return deleted", id },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting return:", error);
    return NextResponse.json(
      { error: "Failed to delete return" },
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

    const prNumber = body.prNumber?.trim().toUpperCase();
    const reason = body.reason?.trim();
    const notes = body.notes?.trim();

    const receipt = await PurchaseReceipt.findOne({ prNumber });

    if (!receipt) {
      return NextResponse.json(
        { error: `No matching purchase receipt found for ${prNumber}` },
        { status: 404 }
      );
    }

    const updated = await PurchaseReturn.findByIdAndUpdate(
      id,
      {
        prNumber,
        supplierName: receipt.supplierName?.trim().toUpperCase() || "UNKNOWN",
        reason,
        notes,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating return:", error);
    return NextResponse.json(
      { error: "Failed to update return" },
      { status: 500 }
    );
  }
}
