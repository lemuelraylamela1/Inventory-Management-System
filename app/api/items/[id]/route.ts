import connectMongoDB from "@/libs/mongodb";
import Item from "@/models/item";
import { NextResponse, NextRequest } from "next/server";

interface ItemPayload {
  itemCode: string;
  itemName: string;
  description: string;
  status: string;
  category: string;
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

interface BulkPayload {
  items: ItemPayload[];
}

export async function POST(request: NextRequest) {
  const raw = await request.json();
  await connectMongoDB();

  try {
    // ✅ Bulk upload
    if ("items" in raw && Array.isArray(raw.items)) {
      const body = raw as BulkPayload;
      await Item.insertMany(body.items);
      return NextResponse.json(
        { message: "Bulk upload successful" },
        { status: 201 }
      );
    }

    // ✅ Single item creation
    const body = raw as ItemPayload;

    const requiredFields = [
      "itemCode",
      "itemName",
      "description",
      "status",
      "category",
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

    // ✅ Optional: check for duplicate itemCode + itemName
    const existing = await Item.findOne({
      itemCode: body.itemCode,
      itemName: body.itemName,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Item with this code and name already exists" },
        { status: 409 }
      );
    }

    const created = await Item.create(body);
    return NextResponse.json(
      { message: "Item created successfully", item: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  await connectMongoDB();

  try {
    const updatedItem = await Item.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updatedItem }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/items/:id error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectMongoDB();

  try {
    const items = await Item.find();
    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("GET /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

type Params = {
  params: {
    id: string;
  };
};

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
