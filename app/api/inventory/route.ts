import { NextResponse } from "next/server";
import connectMongoDB from "../../../libs/mongodb";
import Inventory, { InventoryItem } from "@/models/inventory";

// GET: Fetch all inventory records
export async function GET(request: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const itemCode = searchParams.get("itemCode")?.trim().toUpperCase();
    const warehouse = searchParams.get("warehouse")?.trim().toUpperCase();

    if (itemCode && warehouse) {
      const record = await Inventory.findOne({ warehouse });

      if (!record) {
        return NextResponse.json(
          { error: `No inventory found for warehouse ${warehouse}` },
          { status: 404 }
        );
      }

      const matched = record.items.find(
        (item: InventoryItem) => item.itemCode === itemCode
      );

      if (!matched) {
        return NextResponse.json(
          { error: `Item ${itemCode} not found in ${warehouse}` },
          { status: 404 }
        );
      }

      return NextResponse.json({ qtyLeft: matched.quantity }, { status: 200 });
    }

    // Default: return all records
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
        category: item.category?.trim().toUpperCase() || "UNCATEGORIZED",
        quantity: Number(item.quantity),
        unitType: item.unitType?.trim().toUpperCase() || "",
        purchasePrice: Number(item.purchasePrice) || 0,
        source: item.source?.trim().toUpperCase() || "",
        referenceNumber: item.referenceNumber?.trim().toUpperCase() || "", // ✅ added
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
