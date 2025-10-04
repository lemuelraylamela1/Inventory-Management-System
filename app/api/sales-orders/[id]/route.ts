import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";
import { Types } from "mongoose";
import type {
  SalesOrder,
  SalesOrderItem,
} from "../../../components/sections/type";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json(
      { message: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  const order = await SalesOrderModel.findById(params.id);
  if (!order) {
    return NextResponse.json(
      { message: "Sales order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json(
      { message: "Invalid sales order ID" },
      { status: 400 }
    );
  }

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
  }: SalesOrder = await request.json();

  // Defensive validation
  if (
    (customer && typeof customer !== "string") ||
    (salesPerson && typeof salesPerson !== "string") ||
    (warehouse && typeof warehouse !== "string") ||
    (transactionDate && typeof transactionDate !== "string") ||
    (deliveryDate && typeof deliveryDate !== "string") ||
    (shippingAddress && typeof shippingAddress !== "string") ||
    (notes && typeof notes !== "string") ||
    (status &&
      !["PENDING", "PARTIAL", "COMPLETED", "CANCELLED"].includes(status)) ||
    (items &&
      (!Array.isArray(items) ||
        items.some(
          (item: SalesOrderItem) =>
            !item.itemName ||
            typeof item.quantity !== "number" ||
            typeof item.price !== "number" ||
            typeof item.amount !== "number"
        )))
  ) {
    return NextResponse.json(
      { message: "Invalid update payload" },
      { status: 400 }
    );
  }

  const updatePayload: Partial<SalesOrder> = {};

  if (customer) updatePayload.customer = customer.trim().toUpperCase();
  if (salesPerson) updatePayload.salesPerson = salesPerson.trim().toUpperCase();
  if (warehouse) updatePayload.warehouse = warehouse.trim().toUpperCase();
  if (transactionDate) updatePayload.transactionDate = transactionDate;
  if (deliveryDate) updatePayload.deliveryDate = deliveryDate;
  if (shippingAddress) updatePayload.shippingAddress = shippingAddress.trim();
  if (notes) updatePayload.notes = notes.trim();
  if (status) updatePayload.status = status;

  if (items) {
    updatePayload.items = items;
    updatePayload.total = items.reduce((sum, i) => sum + i.amount, 0);
    updatePayload.totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    updatePayload.balance = updatePayload.total;
  }

  try {
    const order = await SalesOrderModel.findByIdAndUpdate(
      params.id,
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return NextResponse.json(
        { message: "Sales order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Sales order updated", order });
  } catch (error) {
    console.error("❌ Error updating sales order:", error);
    return NextResponse.json(
      { message: "Failed to update sales order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectMongoDB();

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json(
      { message: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  try {
    const result = await SalesOrderModel.findByIdAndDelete(params.id);

    if (!result) {
      return NextResponse.json(
        { message: "Sales order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Sales order deleted" });
  } catch (error) {
    console.error("❌ Error deleting sales order:", error);
    return NextResponse.json(
      { message: "Failed to delete sales order" },
      { status: 500 }
    );
  }
}
