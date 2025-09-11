import connectMongoDB from "@/libs/mongodb";
import Item from "../../../../models/item";
import { NextResponse, NextRequest } from "next/server";

type Params = {
  params: {
    id: string;
  };
};

interface ItemPayload {
  item_code: string;
  item_name: string;
  item_description: string;
  item_status: string;
  item_category: string;
  purchasePrice: number;
  salesPrice: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  createdDT: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = params;

  // ✅ Guard against missing or invalid ID
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid item ID" },
      { status: 400 }
    );
  }

  let body: ItemPayload;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // ✅ Validate required fields
  const requiredFields = [
    "item_code",
    "item_name",
    "item_description",
    "item_status",
    "item_category",
  ] as const;
  for (const field of requiredFields) {
    const value = body[field];
    if (typeof value !== "string" || value.trim() === "") {
      return NextResponse.json(
        { error: `Missing or invalid field: ${field}` },
        { status: 400 }
      );
    }
  }

  // ✅ Optional: validate numeric fields
  const numericFields = [
    "purchasePrice",
    "salesPrice",
    "length",
    "width",
    "height",
    "weight",
  ] as const;
  for (const field of numericFields) {
    const value = body[field];
    if (typeof value !== "number" || isNaN(value) || value <= 0) {
      return NextResponse.json(
        { error: `Invalid value for ${field}` },
        { status: 400 }
      );
    }
  }

  try {
    await connectMongoDB();

    const updated = await Item.findByIdAndUpdate(
      id,
      { ...body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Item updated", item: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;

  // ✅ Guard against missing or invalid ID
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid item ID" },
      { status: 400 }
    );
  }

  try {
    await connectMongoDB();

    const item = await Item.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (err) {
    console.error("GET /api/items/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}
