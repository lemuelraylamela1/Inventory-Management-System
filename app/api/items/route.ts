import connectMongoDB from "../../../libs/mongodb";
import Item from "../../../models/item";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

interface ItemPayload {
  createdDT: string;
  itemCode: string;
  itemName: string;
  description: string;
  purchasePrice: number;
  salesPrice: number;
  category: string;
  status: string;
  imageUrl?: string;
  imagePublicId?: string;
  height?: number;
  weight?: number;
  length?: number;
  width?: number;
}

interface BulkPayload {
  items: ItemPayload[];
}

export async function POST(request: NextRequest) {
  const body: ItemPayload | BulkPayload = await request.json();
  await connectMongoDB();

  try {
    if ("items" in body && Array.isArray(body.items)) {
      await Item.insertMany(body.items);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    const {
      createdDT,
      itemCode,
      itemName,
      description,
      purchasePrice,
      salesPrice,
      category,
      status,
      imageUrl,
      imagePublicId,
      height,
      weight,
      length,
      width,
    } = body as ItemPayload;

    await Item.create({
      createdDT,
      itemCode,
      itemName,
      description,
      purchasePrice,
      salesPrice,
      category,
      status,
      imageUrl,
      imagePublicId,
      height,
      weight,
      length,
      width,
    });

    return NextResponse.json(
      { message: "Item created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { message: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  const items = await Item.find();
  return NextResponse.json({ items });
}

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(
  request: NextRequest,
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

  await connectMongoDB();
  const deleted = await Item.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ message: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Item deleted" }, { status: 200 });
}
