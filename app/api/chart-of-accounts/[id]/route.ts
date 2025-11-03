import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import ChartOfAccount from "@/models/chartOfAccount";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectMongoDB();
  const account = await ChartOfAccount.findById(params.id);
  if (!account)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();
  const updates = await req.json();

  try {
    const updated = await ChartOfAccount.findByIdAndUpdate(params.id, updates, {
      new: true,
    });
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Update failed", details: error },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();
  try {
    const deleted = await ChartOfAccount.findByIdAndDelete(params.id);
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Delete failed", details: error },
      { status: 400 }
    );
  }
}
