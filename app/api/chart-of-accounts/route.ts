import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import ChartOfAccount from "@/models/chartOfAccount";

export async function GET() {
  await connectMongoDB();
  const accounts = await ChartOfAccount.find().sort({ accountCode: 1 });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  try {
    const newAccount = await ChartOfAccount.create(body);
    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account", details: error },
      { status: 400 }
    );
  }
}
