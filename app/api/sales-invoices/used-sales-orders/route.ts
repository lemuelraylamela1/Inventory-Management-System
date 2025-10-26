import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { SalesInvoice } from "../../../../models/salesInvoice";

export async function GET() {
  try {
    await connectMongoDB();

    const invoices = await SalesInvoice.find({}, { salesOrder: 1 });

    const usedSoNumbers = invoices
      .map((invoice) => invoice.salesOrder?.trim().toUpperCase())
      .filter((val): val is string => Boolean(val));

    return NextResponse.json(usedSoNumbers);
  } catch (error) {
    console.error("❌ Error fetching used SO numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch used SO numbers" },
      { status: 500 }
    );
  }
}
