import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import DeliveryModel from "@/models/delivery";
import SalesOrderModel from "@/models/salesOrder";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const body = await req.json();

    // 1. Create Delivery
    const delivery = await DeliveryModel.create({
      soNumber: body.soNumber,
      customer: body.customer,
      warehouse: body.warehouse,
      shippingAddress: body.shippingAddress,
      deliveryDate: body.deliveryDate,
      remarks: body.remarks || "",
      status: body.status || "PREPARED",
      items: body.items || [],
    });

    // 2. Find Sales Order by STRING soNumber
    const so = await SalesOrderModel.findOne({ soNumber: body.soNumber });

    if (so) {
      await SalesOrderModel.findByIdAndUpdate(
        so._id,
        { status: "PREPARED" },
        { new: true }
      );
    } else {
      console.warn("Sales Order not found for soNumber:", body.soNumber);
    }

    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error("POST Delivery Error:", error);
    return NextResponse.json(
      { error: "Failed to create delivery." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();

    const deliveries = await DeliveryModel.find()
      .populate("soNumber")
      .sort({ createdAt: -1 });

    return NextResponse.json(deliveries, { status: 200 });
  } catch (error) {
    console.error("GET Deliveries Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries." },
      { status: 500 }
    );
  }
}
