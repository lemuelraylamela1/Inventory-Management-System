import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";
import InventoryMain from "@/models/inventoryMain";
import {
  computeTotalQuantity,
  formatWeight,
  formatCBM,
  computeSubtotal,
  computeNetTotal,
  computePesoDiscount,
} from "../../../libs/salesOrderMetrics";
import type {
  SalesOrderItem,
  SalesOrder,
} from "../../components/sections/type";

type SalesOrderInput = Omit<
  SalesOrder,
  "_id" | "soNumber" | "createdAt" | "updatedAt"
>;

export async function POST(request: NextRequest) {
  const body: SalesOrderInput = await request.json();

  const {
    customer,
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
    balance,
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
    const enrichedOrder: Omit<
      SalesOrder,
      "_id" | "soNumber" | "createdAt" | "updatedAt"
    > = {
      customer: customer.trim().toUpperCase(),
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
      totalQuantity: computeTotalQuantity(items),
      balance,
      creationDate,
      formattedWeight: formatWeight(items),
      formattedCBM: formatCBM(items),
      formattedTotal: computeSubtotal(items),
      formattedNetTotal: computeNetTotal({ ...body, items, discounts }),
      formattedPesoDiscount: computePesoDiscount(discounts),
    };

    const newOrder = await SalesOrderModel.create(enrichedOrder);

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
