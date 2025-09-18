import PurchaseOrder from "@/models/purchaseOrder";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// PUT: Update a purchase order
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing purchase order ID" },
        { status: 400 }
      );
    }

    // Normalize string fields
    if (updateFields.supplierName) {
      updateFields.supplierName = updateFields.supplierName
        .trim()
        .toUpperCase();
    }
    if (updateFields.warehouse) {
      updateFields.warehouse = updateFields.warehouse.trim().toUpperCase();
    }
    if (updateFields.itemName) {
      updateFields.itemName = updateFields.itemName.trim().toUpperCase();
    }
    if (typeof updateFields.total !== "undefined") {
      updateFields.total = Number(updateFields.total) || 0;
    }
    if (typeof updateFields.balance !== "undefined") {
      updateFields.balance = Number(updateFields.balance) || 0;
    }
    if (updateFields.remarks) {
      updateFields.remarks = updateFields.remarks.trim();
    }
    if (updateFields.status) {
      const allowedStatuses = ["Pending", "Approved", "Rejected", "Completed"];
      updateFields.status = allowedStatuses.includes(updateFields.status)
        ? updateFields.status
        : "Pending";
    }

    const updatedPO = await PurchaseOrder.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedPO) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPO, { status: 200 });
  } catch (error) {
    console.error("Error updating PO:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
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
