import { NextResponse } from "next/server";
import { CustomerType } from "@/models/customerType";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

type Params = {
  params: {
    id: string;
  };
};

export async function PUT(
  req: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid or missing _id:", id);
    return NextResponse.json(
      { message: "Invalid or missing _id" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { message: "Missing update payload" },
        { status: 400 }
      );
    }

    // Transform groupCode and groupName to uppercase if present
    const transformedBody = {
      ...body,
      ...(body.groupCode && { groupCode: body.groupCode.toUpperCase() }),
      ...(body.groupName && { groupName: body.groupName.toUpperCase() }),
    };

    const updated = await CustomerType.findByIdAndUpdate(id, transformedBody, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Customer type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Customer type updated", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating customer type:", error);
    return NextResponse.json(
      { message: "Failed to update customer type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.warn("Invalid or missing _id:", id);
    return NextResponse.json(
      { message: "Invalid or missing _id" },
      { status: 400 }
    );
  }

  try {
    const deleted = await CustomerType.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Customer type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Customer type deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting customer type:", error);
    return NextResponse.json(
      { message: "Failed to delete customer type" },
      { status: 500 }
    );
  }
}
