import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import PriceList from "@/models/priceList";

export async function GET() {
  try {
    await connectMongoDB();

    const priceLists = await PriceList.find().sort({ createdAt: -1 });

    return NextResponse.json(priceLists);
  } catch (error) {
    console.error("GET /price-lists error:", error);
    return NextResponse.json(
      { message: "Failed to fetch price lists" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectMongoDB();
    const body = await req.json();

    const { priceLevelCode, priceLevelName, items = [] } = body;

    if (!priceLevelCode || !priceLevelName) {
      return NextResponse.json(
        { message: "Price level code and name are required." },
        { status: 400 }
      );
    }

    const normalizedCode = priceLevelCode.trim().toUpperCase();

    // Check for duplicates
    const existing = await PriceList.findOne({
      priceLevelCode: normalizedCode,
    });

    if (existing) {
      return NextResponse.json(
        { message: "Price level code already exists." },
        { status: 409 }
      );
    }

    const newPriceList = await PriceList.create({
      priceLevelCode: normalizedCode,
      priceLevelName: priceLevelName.trim(),
      items,
    });

    return NextResponse.json(newPriceList, { status: 201 });
  } catch (error) {
    console.error("POST /price-lists error:", error);
    return NextResponse.json(
      { message: "Failed to create price list" },
      { status: 500 }
    );
  }
}
