import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import User from "@/models/user";

export async function POST(req: NextRequest) {
  await connectMongoDB();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password required" },
      { status: 400 }
    );
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login successful",
      user: {
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
