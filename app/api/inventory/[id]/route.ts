import { NextResponse } from "next/server";
import Inventory, { InventoryItem } from "@/models/inventory";
import InventoryMain from "@/models/inventoryMain"; // ✅ import main store

type InventoryPatchPayload = Partial<{
  warehouse: string;
  remarks: string;
  items: InventoryItem[];
  itemCode: string;
  quantity: number;
  action: "add" | "subtract";
  user?: string;
  particulars?: string;
  updatedAt: Date;
}>;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: InventoryPatchPayload = await request.json();
    const now = new Date();

    const inventory = await Inventory.findById(params.id);
    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    const warehouse = inventory.warehouse?.trim().toUpperCase();

    // 🔁 Quantity adjustment block
    if (
      body.itemCode &&
      typeof body.quantity === "number" &&
      (body.action === "add" || body.action === "subtract")
    ) {
      const itemCode = body.itemCode.trim().toUpperCase();
      const delta = body.action === "add" ? body.quantity : -body.quantity;
      const activity = body.action === "add" ? "IN" : "OUT";

      const item = inventory.items.find(
        (i: InventoryItem) => i.itemCode === itemCode
      );

      if (!item) {
        return NextResponse.json(
          { error: "Item not found in inventory" },
          { status: 404 }
        );
      }

      item.quantity = Math.max(0, item.quantity + delta);
      item.inQty = body.action === "add" ? body.quantity : undefined;
      item.outQty = body.action === "subtract" ? body.quantity : undefined;
      item.currentOnhand = item.quantity;
      item.activity = activity;
      item.user = body.user ?? "system";
      item.particulars = body.particulars ?? "";
      item.date = now.toISOString().split("T")[0];
      item.updatedAt = now;

      inventory.updatedAt = now;
      await inventory.save();

      // ✅ Sync to inventory_main
      await InventoryMain.findOneAndUpdate(
        { itemCode, warehouse },
        {
          $set: {
            itemName: item.itemName,
            unitType: item.unitType,
            updatedAt: now,
          },
          $inc: { quantity: delta },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json(
        { message: "Quantity adjusted", item },
        { status: 200 }
      );
    }

    // 🧱 Standard PATCH block
    const updates: InventoryPatchPayload = {};

    if (typeof body.warehouse === "string") {
      updates.warehouse = body.warehouse.trim().toUpperCase();
    }

    if (typeof body.remarks === "string") {
      updates.remarks = body.remarks.trim();
    }

    if (Array.isArray(body.items)) {
      updates.items = body.items.map((item) => {
        const normalizedQty = Number(item.quantity);
        const itemCode = item.itemCode?.trim().toUpperCase();
        const itemName = item.itemName?.trim();
        const unitType = item.unitType?.trim().toUpperCase();

        // ✅ Sync each item to inventory_main
        if (itemCode && itemName && warehouse && !isNaN(normalizedQty)) {
          InventoryMain.findOneAndUpdate(
            { itemCode, warehouse },
            {
              $set: {
                itemName,
                unitType,
                updatedAt: now,
              },
              $setOnInsert: { warehouse },
              $inc: { quantity: normalizedQty },
            },
            { upsert: true }
          ).catch((err) => console.error("❌ Sync error:", err));
        }

        return {
          itemCode,
          itemName,
          category: item.category?.trim().toUpperCase(),
          quantity: normalizedQty,
          unitType,
          purchasePrice: Number(item.purchasePrice) || 0,
          source: item.source?.trim().toUpperCase() || "",
          referenceNumber: item.referenceNumber?.trim().toUpperCase(),
          activity: item.activity?.trim().toUpperCase(),
          user: item.user?.trim(),
          inQty: item.inQty,
          outQty: item.outQty,
          currentOnhand: item.currentOnhand,
          particulars: item.particulars?.trim(),
          date: item.date?.trim(),
          receivedAt: item.receivedAt ? new Date(item.receivedAt) : now,
          updatedAt: now,
          createdAt: item.createdAt ? new Date(item.createdAt) : now,
        };
      });
    }

    updates.updatedAt = now;

    const patched = await Inventory.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true }
    );

    if (!patched) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(patched, { status: 200 });
  } catch (error) {
    console.error("❌ Error patching inventory:", error);
    return NextResponse.json(
      { error: "Failed to patch inventory" },
      { status: 500 }
    );
  }
}
