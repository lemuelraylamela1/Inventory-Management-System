import PurchaseOrder from "@/models/purchaseOrder";
import { NextResponse } from "next/server";

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

    // Normalize supplierName and warehouse if present
    if (updateFields.supplierName) {
      updateFields.supplierName = updateFields.supplierName
        .trim()
        .toUpperCase();
    }
    if (updateFields.warehouse) {
      updateFields.warehouse = updateFields.warehouse.trim().toUpperCase();
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
