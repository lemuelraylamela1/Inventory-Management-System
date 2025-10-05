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

  const id = params.id?.trim();
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  let payload: Partial<SalesOrder>;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("❌ Failed to parse JSON:", err);
    return NextResponse.json(
      { error: "Malformed request body" },
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
  } = payload;

  // Normalize and validate items
  const normalizedItems: SalesOrderItem[] = Array.isArray(items)
    ? items
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => ({
          _id: item._id,
          itemName: item.itemName?.trim().toUpperCase() || "",
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: item.unitType?.trim().toUpperCase() || "",
          price: Number(item.price) || 0,
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          description: item.description?.trim() || "",
          amount: Number(item.quantity) * Number(item.price),
        }))
    : [];

  const isInvalid =
    (customer && typeof customer !== "string") ||
    (salesPerson && typeof salesPerson !== "string") ||
    (warehouse && typeof warehouse !== "string") ||
    (transactionDate && typeof transactionDate !== "string") ||
    (deliveryDate && typeof deliveryDate !== "string") ||
    (shippingAddress && typeof shippingAddress !== "string") ||
    (notes && typeof notes !== "string") ||
    (status &&
      !["PENDING", "TO PREPARE", "COMPLETED", "CANCELLED"].includes(status)) ||
    (items &&
      (!Array.isArray(items) ||
        normalizedItems.some(
          (item) =>
            typeof item.itemName !== "string" ||
            isNaN(item.quantity) ||
            isNaN(item.price) ||
            isNaN(item.amount)
        )));

  if (isInvalid) {
    return NextResponse.json(
      { error: "Invalid update payload" },
      { status: 400 }
    );
  }

  const updatePayload: Partial<SalesOrder> = {
    customer: customer?.trim().toUpperCase(),
    salesPerson: salesPerson?.trim().toUpperCase(),
    warehouse: warehouse?.trim().toUpperCase(),
    transactionDate,
    deliveryDate,
    shippingAddress: shippingAddress?.trim(),
    notes: notes?.trim(),
    status,
  };

  if (normalizedItems.length > 0) {
    updatePayload.items = normalizedItems;
    updatePayload.total = normalizedItems.reduce((sum, i) => sum + i.amount, 0);
    updatePayload.totalQuantity = normalizedItems.reduce(
      (sum, i) => sum + i.quantity,
      0
    );
    updatePayload.balance = updatePayload.total;
  }

  try {
    const order = await SalesOrderModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Sales order updated", order });
  } catch (error) {
    console.error("❌ Error updating sales order:", error);
    return NextResponse.json(
      { error: "Failed to update sales order" },
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
