import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";
import { Types } from "mongoose";

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
  const updates = await request.json();
  await connectMongoDB();

  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json(
      { message: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  try {
    const order = await SalesOrderModel.findByIdAndUpdate(params.id, updates, {
      new: true,
      runValidators: true,
    });

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
