import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import AtcCode from "../../../../models/atcCode";

// GET single ATC Code by ID
export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  await connectMongoDB();
  const code = await AtcCode.findById(params.id);
  if (!code) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(code);
}

// PATCH update ATC Code
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  await connectMongoDB();
  const updates = await req.json();
  const updated = await AtcCode.findByIdAndUpdate(params.id, updates, {
    new: true,
  });
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE ATC Code
export async function DELETE(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  await connectMongoDB();
  const deleted = await AtcCode.findByIdAndDelete(params.id);
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ message: "Deleted successfully" });
}
