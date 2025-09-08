import connectMongoDB from "../../../libs/mongodb";
import Item from "../../../models/item";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  await connectMongoDB();

  try {
    // Bulk insert if body contains an array of items
    if (Array.isArray(body.items)) {
      await Item.insertMany(body.items);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    // Single item insert
    const {
      createdDT,
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
    } = body;

    await Item.create({
      createdDT,
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

    return NextResponse.json({ message: "Item created" }, { status: 201 });
  } catch (error) {
    console.error("Error creating item(s):", error);
    return NextResponse.json(
      { message: "Failed to create item(s)" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();
  const items = await Item.find();
  return NextResponse.json({ items });
}

export async function DELETE(request) {
  const id = request.nextUrl.searchParams.get("id");
  await connectMongoDB();
  await Topic.findByIdAndDelete(id);
  return NextResponse.json({ message: "Topic deleted" }, { status: 200 });
}
