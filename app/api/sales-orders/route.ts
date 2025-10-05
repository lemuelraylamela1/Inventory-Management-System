import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";
import InventoryMain from "@/models/inventoryMain";
import type {
  SalesOrderItem,
  SalesOrder,
} from "../../components/sections/type";

type SalesOrderInput = Omit<
  SalesOrder,
  "_id" | "soNumber" | "createdAt" | "updatedAt"
>;

export async function POST(request: NextRequest) {
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
    total,
    totalQuantity,
    balance,
    creationDate,
  }: SalesOrderInput = await request.json();

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
    const newOrder = await SalesOrderModel.create({
      customer: customer.trim().toUpperCase(),
      salesPerson: salesPerson.trim().toUpperCase(),
      warehouse: warehouse.trim().toUpperCase(),
      transactionDate,
      deliveryDate,
      shippingAddress: shippingAddress?.trim() || "",
      notes: notes?.trim() || "",
      status,
      items,
      total,
      totalQuantity,
      balance,
      creationDate,
    });

    const now = new Date();

    // ✅ Deduct quantities from InventoryMain
    for (const item of items) {
      await InventoryMain.findOneAndUpdate(
        {
          itemCode: item.itemCode?.trim().toUpperCase(),
          warehouse: warehouse.trim().toUpperCase(),
        },
        {
          $inc: { quantity: -Math.abs(item.quantity) },
          $set: {
            itemName: item.itemName?.trim().toUpperCase(),
            unitType: item.unitType?.trim().toUpperCase(),
            updatedAt: now,
          },
          $setOnInsert: {
            warehouse: warehouse.trim().toUpperCase(),
          },
        },
        { upsert: true }
      );
    }

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
