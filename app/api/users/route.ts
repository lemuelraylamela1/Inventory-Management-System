import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import User from "@/models/user";

export async function GET(req: NextRequest) {
  await connectMongoDB();
  try {
    const users = await User.find().select("-__v").lean();
    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
