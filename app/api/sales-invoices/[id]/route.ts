import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "@/models/salesInvoice";
import { SalesOrderItem } from "@/app/components/sections/type";

async function validateId(id?: string) {
  const trimmed = id?.trim();
  if (!trimmed || !mongoose.Types.ObjectId.isValid(trimmed)) {
    throw new Error("Invalid ID");
  }
  return trimmed;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();
  try {
    const { id } = await context.params;
    const validId = await validateId(id);

    const invoice = await SalesInvoice.findById(validId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    console.error("❌ GET invoice error:", err);
    const message = getErrorMessage(err);
    const status = message === "Invalid ID" ? 400 : 500;
    return NextResponse.json(
      { error: message || "Failed to fetch invoice" },
      { status }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();
  try {
    const updates = await req.json();
    const { id } = await context.params;
    const validId = await validateId(id);

    // If items are being updated, sync availableQuantity with quantity
    if (updates.items && Array.isArray(updates.items)) {
      updates.items = updates.items.map((item: SalesOrderItem) => ({
        ...item,
        availableQuantity: item.quantity, // auto-sync
      }));
    }

    const invoice = await SalesInvoice.findByIdAndUpdate(validId, updates, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    console.error("❌ PATCH invoice error:", err);
    const message = getErrorMessage(err);
    const status = message === "Invalid ID" ? 400 : 500;
    return NextResponse.json(
      { error: message || "Failed to update invoice" },
      { status }
    );
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();
  try {
    const { id } = await context.params;
    const validId = await validateId(id);

    const deleted = await SalesInvoice.findByIdAndDelete(validId);
    if (!deleted) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ DELETE invoice error:", err);
    const message = getErrorMessage(err);
    const status = message === "Invalid ID" ? 400 : 500;
    return NextResponse.json(
      { error: message || "Failed to delete invoice" },
      { status }
    );
  }
}
