import connectMongoDB from "@/libs/mongodb";
import Item from "../../../../models/item";
import { NextResponse, NextRequest } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

interface ItemPayload {
  item_code: string;
  item_name: string;
  item_description: string;
  item_category: string;
  item_status: string;
  imageUrl?: string;
  height?: number;
  weight?: number;
  length?: number;
  width?: number;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params;
  const body: ItemPayload = await request.json();

  await connectMongoDB();

  await Item.findByIdAndUpdate(id, {
    ...body,
  });

  return NextResponse.json({ message: "Item updated" }, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params;

  try {
    await connectMongoDB();
    await Item.findByIdAndDelete(id);

    return NextResponse.json({ message: "Item deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;

  await connectMongoDB();
  const item = await Item.findOne({ _id: id });

  return NextResponse.json({ item }, { status: 200 });
}
