// /api/sales-orders/by-customer/[name]/route.ts
import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrder from "@/models/salesOrder";

export async function GET(
  req: Request,
  context: { params: Promise<{ name?: string }> }
) {
  await connectMongoDB();

  const rawName = (await context.params)?.name;
  if (!rawName || rawName.trim().length < 1) {
    return NextResponse.json(
      { error: "Invalid customer name" },
      { status: 400 }
    );
  }

  const name = decodeURIComponent(rawName.trim().toUpperCase());
  console.log(`🔍 Fetching sales orders for customer: ${name}`);

  try {
    const orders = await SalesOrder.find({ customer: name })
      .select(
        "soNumber reference formattedTotal formattedNetTotal status createdAt"
      )
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} orders`);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("❌ Failed to fetch sales orders:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
