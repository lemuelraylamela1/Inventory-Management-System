import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import AccountsPayable from "@/models/accountsPayable";

export async function GET() {
  await connectMongoDB();
  const payables = await AccountsPayable.find().sort({ voucherNo: 1 });
  return NextResponse.json(payables);
}

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  try {
    const newPayable = await AccountsPayable.create(body);
    return NextResponse.json(newPayable, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account payable", details: error },
      { status: 400 }
    );
  }
}
