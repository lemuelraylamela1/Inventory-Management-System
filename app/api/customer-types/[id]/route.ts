import { NextResponse } from "next/server";
import { CustomerType } from "@/models/customerType";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

type Params = {
  params: {
    id: string;
  };
};

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
