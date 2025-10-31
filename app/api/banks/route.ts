import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import Bank from "@/models/bank";

export async function POST(req: NextRequest) {
  await connectMongoDB();
  const body = await req.json();

  try {
    const created = await Bank.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create bank", details: error },
      { status: 400 }
    );
  }
}

export async function GET() {
  await connectMongoDB();

  try {
    const banks = await Bank.find().sort({ bankAccountName: 1 });
    return NextResponse.json(banks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch banks", details: error },
      { status: 500 }
    );
  }
}
