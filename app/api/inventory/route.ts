import { NextResponse } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import Inventory, { InventoryItem } from "@/models/inventory";

// GET: Fetch all inventory records
export async function GET() {
  try {
    await connectMongoDB(); // ✅ Ensure DB connection
    const records = await Inventory.find().sort({ updatedAt: -1 });
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to retrieve inventory" },
      { status: 500 }
    );
  }
}

// POST: Create or update inventory for a warehouse
export async function POST(request: Request) {
  try {
    await connectMongoDB(); // ✅ Ensure DB connection

    const body = await request.json();
    const warehouse = body.warehouse?.trim().toUpperCase();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!warehouse || items.length === 0) {
      return NextResponse.json(
        { error: "Warehouse and items are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const normalizedItems: InventoryItem[] = items.map(
      (item: Partial<InventoryItem>) => ({
        itemCode: item.itemCode?.trim().toUpperCase() || "",
        itemName: item.itemName?.trim() || "",
        category: item.category?.trim().toUpperCase() || "UNCATEGORIZED", // ✅ added
        quantity: Number(item.quantity),
        unitType: item.unitType?.trim().toUpperCase() || "",
        purchasePrice: Number(item.purchasePrice) || 0,
        source: item.source?.trim().toUpperCase() || "",
        updatedAt: now,
        receivedAt: item.receivedAt ? new Date(item.receivedAt) : now,
        createdAt: item.createdAt ? new Date(item.createdAt) : now,
      })
    );

    const updated = await Inventory.findOneAndUpdate(
      { warehouse },
      {
        $set: { updatedAt: now },
        $push: { items: { $each: normalizedItems } },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(updated, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ Error updating inventory:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
