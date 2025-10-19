import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";

export async function GET(
  _: Request,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();

  const { id } = await context.params;
  const trimmedId = id?.trim();

  if (!trimmedId || !mongoose.Types.ObjectId.isValid(trimmedId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    const invoice = await SalesInvoice.findById(trimmedId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("❌ Failed to fetch invoice:", err);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();
  const updates = await req.json();

  const { id } = await context.params;
  const trimmedId = id?.trim();

  if (!trimmedId || !mongoose.Types.ObjectId.isValid(trimmedId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    const invoice = await SalesInvoice.findByIdAndUpdate(trimmedId, updates, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("❌ Failed to update invoice:", err);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();

  const { id } = await context.params;
  const trimmedId = id?.trim();

  if (!trimmedId || !mongoose.Types.ObjectId.isValid(trimmedId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    const deleted = await SalesInvoice.findByIdAndDelete(trimmedId);

    if (!deleted) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete invoice:", err);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
