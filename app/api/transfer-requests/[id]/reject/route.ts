import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();
    const { id } = params;

    const request = await TransferRequestModel.findById(id);
    if (!request) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    if (request.status === "REJECTED") {
      return NextResponse.json({ error: "Already rejected" }, { status: 400 });
    }

    request.status = "REJECTED";
    await request.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Rejection error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
