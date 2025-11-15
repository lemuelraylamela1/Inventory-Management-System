import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import DeliveryModel from "@/models/delivery";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const body = await req.json();

    const delivery = await DeliveryModel.create({
      soNumber: body.soNumber,
      customer: body.customer,
      warehouse: body.warehouse,
      shippingAddress: body.shippingAddress,
      deliveryDate: body.deliveryDate,
      remarks: body.remarks || "",
      status: body.status || "PREPARED",
      items: body.items || [], // <-- save items
    });

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
