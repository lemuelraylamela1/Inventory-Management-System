import { NextResponse } from "next/server";
import Inventory, { InventoryItem } from "@/models/inventory";

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
      updates.items = body.items.map((item) => ({
        itemCode: item.itemCode?.trim().toUpperCase(),
        itemName: item.itemName?.trim(),
        category: item.category?.trim().toUpperCase(),
        quantity: Number(item.quantity),
        unitType: item.unitType?.trim().toUpperCase(),
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
      }));
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
