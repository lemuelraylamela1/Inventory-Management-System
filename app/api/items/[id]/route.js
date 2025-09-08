import connectMongoDB from "@/libs/mongodb";
import Item from "../../../../models/item";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;

  const {
    item_code,
    item_name,
    item_description,
    item_category,
    item_status,
    imageUrl,
    height,
    weight,
    length,
    width, // ✅ Add this line
  } = await request.json();

  await connectMongoDB();

  await Item.findByIdAndUpdate(id, {
    item_code,
    item_name,
    item_description,
    item_category,
    item_status,
    imageUrl,
    height,
    weight,
    length,
    width,
  });

  return NextResponse.json({ message: "Item updated" }, { status: 200 });
}

export async function DELETE(request, { params }) {
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

export async function GET(request, { params }) {
  const { id } = params;
  await connectMongoDB();
  const item = await Item.findOne({ _id: id });
  return NextResponse.json({ item }, { status: 200 });
}
