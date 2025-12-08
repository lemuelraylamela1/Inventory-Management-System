import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import User from "@/models/user"; // Your Mongoose User model
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await connectMongoDB();
    const body = await req.json();
    const { role, password } = body;

    // Build update object
    const updateData: Partial<{ role: string; password: string }> = {};

    if (role) {
      updateData.role = role;
    }

    if (password) {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password"); // exclude password from response

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
