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
import { adjustInventoryReservation } from "@/libs/adjustInventoryReservation";

type SalesOrderInput = Omit<
  SalesOrder,
  "_id" | "soNumber" | "createdAt" | "updatedAt"
>;

export async function POST(request: NextRequest) {
  const body: SalesOrderInput = await request.json();

  const {
    customer,
    address,
    contactNumber,
    salesPerson,
    warehouse,
    transactionDate,
    deliveryDate,
    shippingAddress,
    notes,
    status,
    items,
    discounts = [],
    total,
    creationDate,
  } = body;

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
    const totalQuantity = computeTotalQuantity(items);
    const formattedWeight = formatWeight(items);
    const formattedCBM = formatCBM(items);
    const formattedTotal = computeSubtotal(items);
    const { breakdown: discountBreakdown, formattedNetTotal } =
      computeDiscountBreakdown(total, discounts);

    const enrichedOrder: Omit<
      SalesOrder,
      "_id" | "soNumber" | "createdAt" | "updatedAt"
    > = {
      customer: customer.trim().toUpperCase(),
      address: address.trim().toUpperCase(),
      contactNumber: contactNumber.trim().toUpperCase(),
      salesPerson: salesPerson.trim().toUpperCase(),
      warehouse: warehouse.trim().toUpperCase(),
      transactionDate,
      deliveryDate,
      shippingAddress: shippingAddress?.trim() || "",
      notes: notes?.trim() || "",
      status,
      items,
      discounts,
      total,
      totalQuantity,
      creationDate,
      formattedWeight,
      formattedCBM,
      formattedTotal,
      formattedNetTotal,
      discountBreakdown,
    };

    const newOrder = await SalesOrderModel.create(enrichedOrder);
    await adjustInventoryReservation(items, warehouse, "reserve");

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
