import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import AccountsReceivable from "@/models/accountsReceivable";

export async function GET() {
  await connectMongoDB();
  const receivables = await AccountsReceivable.find().sort({ voucherNo: 1 });
  return NextResponse.json(receivables);
}

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  try {
    const newReceivable = await AccountsReceivable.create(body);
    return NextResponse.json(newReceivable, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account receivable", details: error },
      { status: 400 }
    );
  }
}
