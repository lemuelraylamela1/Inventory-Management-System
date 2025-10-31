import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import Bank from "@/models/bank";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();

  try {
    const bank = await Bank.findById(params.id);
    if (!bank)
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    return NextResponse.json(bank, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bank", details: error },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();
  const body = await req.json();

  try {
    const updated = await Bank.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!updated)
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update bank", details: error },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();

  try {
    const deleted = await Bank.findByIdAndDelete(params.id);
    if (!deleted)
      return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    return NextResponse.json(
      { message: "Bank deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete bank", details: error },
      { status: 500 }
    );
  }
}
