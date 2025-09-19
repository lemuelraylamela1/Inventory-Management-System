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
    totalQuantity: totalQuantity,
    balance: Number(fields.balance ?? totalAmount) || 0,
    remarks: fields.remarks?.trim() || "",
    status: allowedStatuses.includes(
      fields.status?.trim() as (typeof allowedStatuses)[number]
    )
      ? fields.status!.trim()
      : "Pending",
  };
}

// POST: Create a new purchase order
export async function POST(request: Request) {
  try {
    const body: PurchaseOrderType = await request.json();

    const normalizedItems = normalizeItems(body.items || []);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    const totalQuantity = normalizedItems.reduce(
      (sum: number, item: PurchaseOrderItem) => sum + item.quantity,
      0
    );

    const totalAmount = normalizedItems.reduce(
      (sum: number, item: PurchaseOrderItem) =>
        sum + item.quantity * item.purchasePrice,
      0
    );

    const newPO = await PurchaseOrder.create({
      referenceNumber: body.referenceNumber?.trim().toUpperCase(),
      supplierName: body.supplierName?.trim().toUpperCase(),
      warehouse: body.warehouse?.trim().toUpperCase(),
      items: normalizedItems,
      total: totalAmount,
      totalQuantity: totalQuantity,
      balance: Number(body.balance ?? totalAmount) || 0,
      remarks: body.remarks?.trim() || "",
      status: body.status?.trim() || "Pending",
    });

    return NextResponse.json(newPO, { status: 201 });
  } catch (error) {
    console.error("Error creating PO:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

// PUT: Update a purchase order
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
