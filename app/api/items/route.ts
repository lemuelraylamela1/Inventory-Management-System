import connectMongoDB from "../../../libs/mongodb";
import Item from "../../../models/item";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

interface ItemPayload {
  /* item details */
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
  /* unit of measure */
  unitCode?: string;
  unitDescription?: string;
  unitType?: string;
  unitStatus?: string;
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
      unitCode,
      unitDescription,
      unitType,
      unitStatus,
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
      unitCode,
      unitDescription,
      unitType,
      unitStatus,
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

export async function GET(req: NextRequest) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name"); // query param

    let items;
    if (name) {
      // Case-insensitive exact match
      items = await Item.find({
        itemName: { $regex: new RegExp(`^${name}$`, "i") },
      });
    } else {
      items = await Item.find();
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("GET /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
