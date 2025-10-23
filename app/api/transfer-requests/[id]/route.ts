import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";

// GET /api/transfer-requests/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();
  try {
    const request = await TransferRequestModel.findById(params.id);
    if (!request) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ request }, { status: 200 });
  } catch (err) {
    console.error("❌ Failed to fetch transfer request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/transfer-requests/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();
  const updates = await req.json();

  try {
    const request = await TransferRequestModel.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!request) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request }, { status: 200 });
  } catch (err) {
    console.error("❌ Failed to update transfer request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/transfer-requests/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();
  try {
    const deleted = await TransferRequestModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Transfer request deleted" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Failed to delete transfer request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
