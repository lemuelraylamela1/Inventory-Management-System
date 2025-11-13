import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import InventoryMain from "@/models/inventoryMain";
import { InventoryItem } from "@/models/inventory"; // ✅ for typing

// 📦 CREATE or UPDATE inventory_main
export async function POST(request: Request) {
  try {
    await connectMongoDB();
    const body = await request.json();
    const now = new Date();

    const normalizedItems: InventoryItem[] = [];

    // ✅ Handle batch insert
    if (Array.isArray(body.items)) {
      normalizedItems.push(
        ...body.items.map((item: Partial<InventoryItem>) => ({
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          itemName: item.itemName?.trim() || "",
          category: item.category?.trim().toUpperCase() || "UNCATEGORIZED",
          quantity: Number(item.quantity),
          unitType: item.unitType?.trim().toUpperCase() || "",
          purchasePrice: Number(item.purchasePrice) || 0,
          source: item.source?.trim().toUpperCase() || "",
          referenceNumber: item.referenceNumber?.trim().toUpperCase() || "",
          updatedAt: now,
          receivedAt: item.receivedAt ? new Date(item.receivedAt) : now,
          createdAt: item.createdAt ? new Date(item.createdAt) : now,
        }))
      );
    } else {
      // ✅ Handle single item insert
      const itemCode = body.itemCode?.trim().toUpperCase();
      const itemName = body.itemName?.trim();
      const warehouse = body.warehouse?.trim().toUpperCase();
      const quantity = Number(body.quantity);
      const unitType = body.unitType?.trim().toUpperCase();

      if (!itemCode || !itemName || !warehouse || isNaN(quantity)) {
        return NextResponse.json(
          { error: "Missing or invalid fields" },
          { status: 400 }
        );
      }

      normalizedItems.push({
        itemCode,
        itemName,
        category: "UNCATEGORIZED",
        quantity,
        unitType,
        purchasePrice: 0,
        source: "",
        referenceNumber: "",
        updatedAt: now,
        receivedAt: now,
        createdAt: now,
      });
    }

    // ✅ Sync each item to inventory_main
    for (const item of normalizedItems) {
      const itemCode = item.itemCode;
      const itemName = item.itemName;
      const unitType = item.unitType;
      const quantity = item.quantity;
      const warehouse = body.warehouse?.trim().toUpperCase();

      if (!itemCode || !itemName || !warehouse || isNaN(quantity)) continue;

      await InventoryMain.findOneAndUpdate(
        { itemCode, warehouse },
        {
          $set: {
            itemName,
            unitType,
            updatedAt: now,
          },
          $setOnInsert: { warehouse },
          $inc: { quantity },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating inventory_main:", error);
    return NextResponse.json(
      { error: "Failed to update inventory_main" },
      { status: 500 }
    );
  }
}

// 📋 READ inventory_main
export async function GET(request: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const itemCode = searchParams.get("itemCode")?.trim().toUpperCase();
    const warehouse = searchParams.get("warehouse")?.trim().toUpperCase();

    if (itemCode && warehouse) {
      const record = await InventoryMain.findOne({ itemCode, warehouse });
      if (!record) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(record, { status: 200 });
    }

    const all = await InventoryMain.find().sort({ updatedAt: -1 });
    return NextResponse.json(all, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching inventory_main:", error);
    return NextResponse.json(
      { error: "Failed to retrieve inventory_main" },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE ALL (or by warehouse)
export async function DELETE(request: Request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get("warehouse")?.trim().toUpperCase();

    let deleteResult;

    if (warehouse) {
      deleteResult = await InventoryMain.deleteMany({ warehouse });
    } else {
      deleteResult = await InventoryMain.deleteMany({});
    }

    return NextResponse.json(
      {
        success: true,
        deletedCount: deleteResult.deletedCount,
        message: warehouse
          ? `All records for warehouse ${warehouse} deleted.`
          : "All inventory_main records deleted.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting inventory_main:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory_main records" },
      { status: 500 }
    );
  }
}
