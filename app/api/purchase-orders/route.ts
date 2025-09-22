// app/api/purchase-orders/route.ts
import PurchaseOrder from "@/models/purchaseOrder";
import { NextResponse } from "next/server";
import {
  PurchaseOrderType,
  PurchaseOrderItem,
} from "@/app/components/sections/type";

function normalizeItems(items: PurchaseOrderItem[]): PurchaseOrderItem[] {
  return items.map((item) => ({
    itemName: item.itemName?.trim().toUpperCase() || "",
    quantity: Number(item.quantity) || 0,
    unitType: item.unitType?.trim().toUpperCase() || "",
    purchasePrice: Number(item.purchasePrice) || 0,
    itemCode: item.itemCode?.trim().toUpperCase() || "",
  }));
}

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
      (sum, item) => sum + item.quantity,
      0
    );
    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );

    const newPO = await PurchaseOrder.create({
      referenceNumber: body.referenceNumber?.trim().toUpperCase(),
      supplierName: body.supplierName?.trim().toUpperCase(),
      warehouse: body.warehouse?.trim().toUpperCase(),
      items: normalizedItems,
      total: totalAmount,
      totalQuantity,
      balance: Number(body.balance ?? totalAmount) || 0,
      remarks: body.remarks?.trim() || "",
      status: body.status?.trim() || "PENDING",
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
