// /api/sales-orders/by-customer/[name]/route.ts
import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrder from "@/models/salesOrder";

export async function GET(
  req: Request,
  { params }: { params: { name: string } }
) {
  await connectMongoDB();
  const name = decodeURIComponent(params.name.trim().toUpperCase());

  try {
    const orders = await SalesOrder.find({
      customer: name,
    }).select(
      "soNumber reference formattedTotal formattedNetTotal status createdAt"
    );

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("❌ Failed to fetch sales orders:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
