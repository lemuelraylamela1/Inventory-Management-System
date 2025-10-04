import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";

export async function GET() {
  await connectMongoDB();

  const orders = await SalesOrderModel.find().sort({ creationDate: -1 });
  return NextResponse.json({ salesOrders: orders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { customer, amount, status, creationDate, transactionDate, remarks } =
    body;

  // Defensive validation aligned with schema
  if (
    !customer ||
    typeof amount !== "number" ||
    !["PENDING", "PARTIAL", "COMPLETED", "CANCELLED"].includes(status) ||
    !creationDate ||
    !transactionDate
  ) {
    return NextResponse.json(
      { message: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  await connectMongoDB();

  try {
    const newOrder = await SalesOrderModel.create({
      customer,
      amount,
      status,
      creationDate,
      transactionDate,
      remarks,
    });

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
