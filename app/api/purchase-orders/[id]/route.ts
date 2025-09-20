// app/api/purchase-orders/[id]/route.ts
import PurchaseOrder from "@/models/purchaseOrder";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import {
  PurchaseOrderType,
  PurchaseOrderItem,
} from "@/app/components/sections/type";

const allowedStatuses = [
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
] as const;

function normalizeItems(items: PurchaseOrderItem[]): PurchaseOrderItem[] {
  return items.map((item) => ({
    itemName: item.itemName?.trim().toUpperCase() || "",
    quantity: Number(item.quantity) || 0,
    unitType: item.unitType?.trim().toUpperCase() || "",
    purchasePrice: Number(item.purchasePrice) || 0,
    itemCode: item.itemCode?.trim().toUpperCase() || "",
  }));
}

function normalizeUpdateFields(fields: PurchaseOrderType) {
  const normalizedItems = normalizeItems(fields.items || []);
  const totalQuantity = normalizedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalAmount = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.purchasePrice,
    0
  );

  return {
    referenceNumber: fields.referenceNumber?.trim().toUpperCase() || "",
    supplierName: fields.supplierName?.trim().toUpperCase() || "",
    warehouse: fields.warehouse?.trim().toUpperCase() || "",
    items: normalizedItems,
    total: totalAmount,
    totalQuantity,
    balance: Number(fields.balance ?? totalAmount) || 0,
    remarks: fields.remarks?.trim() || "",
    status: allowedStatuses.includes(
      fields.status?.trim() as (typeof allowedStatuses)[number]
    )
      ? fields.status!.trim()
      : "Pending",
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: PurchaseOrderType = await request.json();
    const id = params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing purchase order ID" },
        { status: 400 }
      );
    }

    const updateFields = normalizeUpdateFields(body);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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
      { message: "Purchase order deleted successfully", id },
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing purchase order ID" },
        { status: 400 }
      );
    }

    const po = await PurchaseOrder.findById(id);

    if (!po) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(po, { status: 200 });
  } catch (error) {
    console.error("Error fetching PO:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchase order" },
      { status: 500 }
    );
  }
}
