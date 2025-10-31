import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import AccountCode from "@/models/accountCodes";

export async function POST(req: NextRequest) {
  await connectMongoDB();
  const body = await req.json();

  try {
    const created = await AccountCode.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account code", details: error },
      { status: 400 }
    );
  }
}

export async function GET() {
  await connectMongoDB();

  try {
    const codes = await AccountCode.find().sort({ accountCode: 1 });
    return NextResponse.json(codes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account codes", details: error },
      { status: 500 }
    );
  }
}
