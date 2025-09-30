import { NextResponse } from "next/server";
import Inventory, { InventoryItem } from "@/models/inventory";

type InventoryPatchPayload = Partial<{
  warehouse: string;
  remarks: string;
  items: InventoryItem[];
  updatedAt: Date;
}>;

// GET: Fetch inventory by ID
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const record = await Inventory.findById(params.id);
    if (!record) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to retrieve inventory" },
      { status: 500 }
    );
  }
}

// PATCH: Partially update inventory by ID
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updates: InventoryPatchPayload = {};
    const now = new Date();

    if (typeof body.warehouse === "string") {
      updates.warehouse = body.warehouse.trim().toUpperCase();
    }

    if (typeof body.remarks === "string") {
      updates.remarks = body.remarks.trim();
    }

    if (Array.isArray(body.items)) {
      const normalizedItems: InventoryItem[] = body.items.map(
        (item: InventoryItem) => ({
          itemCode: item.itemCode?.trim().toUpperCase(),
          itemName: item.itemName?.trim(),
          quantity: Number(item.quantity),
          unitType: item.unitType?.trim().toUpperCase(),
          purchasePrice: Number(item.purchasePrice) || 0,
          source: item.source?.trim().toUpperCase() || "",
          updatedAt: now,
          receivedAt: item.receivedAt ? new Date(item.receivedAt) : now,
          createdAt: item.createdAt ? new Date(item.createdAt) : now,
        })
      );
      updates.items = normalizedItems;
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

// DELETE: Remove inventory by ID
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await Inventory.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Inventory deleted", id: params.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting inventory:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory" },
      { status: 500 }
    );
  }
}
