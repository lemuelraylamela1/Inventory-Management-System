import PurchaseOrder from "@/models/purchaseOrder";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// POST: Create a new purchase order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Incoming body:", body);

    const newPO = await PurchaseOrder.create({
      poNumber: body.poNumber?.trim(),
      referenceNumber: body.referenceNumber,
      supplierName: body.supplierName?.trim().toUpperCase(),
      warehouse: body.warehouse?.trim().toUpperCase(),
      itemName: body.itemName?.trim().toUpperCase(),
      total: Number(body.total) || 0,
      balance: Number(body.balance ?? body.amount) || 0,
      remarks: body.remarks,
      status: body.status ?? "Pending",
    });

    console.log("Created PO:", newPO);
    return NextResponse.json(newPO, { status: 201 });
  } catch (error) {
    console.error("Error creating PO:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

// GET: Retrieve all purchase orders
export async function GET() {
  try {
    const purchaseOrders = await PurchaseOrder.find().sort({ createdAt: -1 });
    return NextResponse.json(purchaseOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchase orders" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a purchase order by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.warn("Invalid or missing purchase order ID:", id);
      return NextResponse.json(
        { error: "Invalid or missing purchase order ID" },
        { status: 400 }
      );
    }

    const deletedPO = await PurchaseOrder.findByIdAndDelete(id);

    if (!deletedPO) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Purchase order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting PO:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}
