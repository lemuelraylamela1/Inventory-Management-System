import { NextResponse } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import AtcCode from "../../../models/atcCode";

// GET all ATC Codes
export async function GET() {
  await connectMongoDB();
  const codes = await AtcCode.find().sort({ atcCode: 1 });
  return NextResponse.json(codes);
}

// POST new ATC Code
export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();
  const newCode = await AtcCode.create(body);
  return NextResponse.json(newCode, { status: 201 });
}
