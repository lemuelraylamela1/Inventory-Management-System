import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import User from "@/models/user";

export async function POST(req: NextRequest) {
  await connectMongoDB();
  const body = await req.json();

  const { fullName, email, password, role, status } = body;

  if (!fullName || !email || !password || !role || !status) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 409 }
    );
  }

  try {
    const user = await User.create({
      fullName,
      email,
      password, // plain text
      role,
      status,
    });
    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}
