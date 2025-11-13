import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";
import {
  computeTotalQuantity,
  formatWeight,
  formatCBM,
  computeSubtotal,
} from "../../../libs/salesOrderMetrics";
import { computeDiscountBreakdown } from "@/libs/discountUtils";
import type {
  SalesOrderItem,
  SalesOrder,
} from "../../components/sections/type";
import InventoryMain from "@/models/inventoryMain";

type SalesOrderInput = Omit<
  SalesOrder,
  "_id" | "soNumber" | "createdAt" | "updatedAt"
>;

export async function POST(request: NextRequest) {
  const body: SalesOrderInput = await request.json();
  const { items, warehouse, ...rest } = body;

  const invalidItem = items.find(
    (item: SalesOrderItem) =>
      !item.itemName ||
      typeof item.quantity !== "number" ||
      typeof item.price !== "number" ||
      typeof item.amount !== "number"
  );

  if (invalidItem) {
    return NextResponse.json(
      { message: "Invalid item details" },
      { status: 400 }
    );
  }

  await connectMongoDB();

  try {
    // create order as before
    const totalQuantity = computeTotalQuantity(items);
    const formattedWeight = formatWeight(items);
    const formattedCBM = formatCBM(items);
    const formattedTotal = computeSubtotal(items);
    const { breakdown: discountBreakdown, formattedNetTotal } =
      computeDiscountBreakdown(rest.total, rest.discounts);

    const enrichedOrder = {
      ...rest,
      warehouse: warehouse.trim().toUpperCase(),
      items,
      totalQuantity,
      formattedWeight,
      formattedCBM,
      formattedTotal,
      formattedNetTotal,
      discountBreakdown,
    };

    const newOrder = await SalesOrderModel.create(enrichedOrder);

    // 🔹 Reserve inventory: move from availableQuantity → quantityOnHold
    for (const item of items) {
      if (!item.itemCode) continue; // skip if no itemCode
      const itemCode = item.itemCode.trim().toUpperCase();
      const quantity = item.quantity;

      if (!quantity || quantity <= 0) continue; // skip invalid quantities

      await InventoryMain.findOneAndUpdate(
        { itemCode, warehouse: warehouse.trim().toUpperCase() },
        {
          $inc: {
            availableQuantity: -quantity, // deduct from available
            quantityOnHold: quantity, // add to on-hold
          },
        },
        { new: true, upsert: true }
      );
    }

    // Optional: keep your old function for tracking reservations
    // await adjustInventoryReservation(items, warehouse, "reserve");

    return NextResponse.json(
      { message: "Sales order created", order: newOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating sales order:", error);
    return NextResponse.json(
      { message: "Failed to create sales order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();

  const orders = await SalesOrderModel.find().sort({ createdAt: -1 });
  return NextResponse.json({ salesOrders: orders });
}
