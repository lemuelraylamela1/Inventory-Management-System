import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import AccountClass from "@/models/accountClass";

export async function GET(req: NextRequest) {
  await connectMongoDB();

  try {
    const classes = await AccountClass.find().sort({ accountClassCode: 1 });
    return NextResponse.json({ classes }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to fetch account classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch account classes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectMongoDB();

  try {
    const body = await req.json();
    const created = await AccountClass.create(body);
    return NextResponse.json({ accountClass: created }, { status: 201 });
  } catch (error) {
    console.error("❌ Failed to create account class:", error);
    return NextResponse.json(
      { error: "Failed to create account class" },
      { status: 400 }
    );
  }
}
