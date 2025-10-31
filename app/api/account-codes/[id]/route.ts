import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb";
import AccountCode from "@/models/accountCodes";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();

  try {
    const code = await AccountCode.findById(params.id);
    if (!code)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(code, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account code", details: error },
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
    const updated = await AccountCode.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update account code", details: error },
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
    const deleted = await AccountCode.findByIdAndDelete(params.id);
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account code", details: error },
      { status: 500 }
    );
  }
}
