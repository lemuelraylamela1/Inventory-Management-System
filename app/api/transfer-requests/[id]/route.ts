import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import InventoryMain from "@/models/inventoryMain";
import type { TransferRequestItem } from "../../../components/sections/type";

// GET /api/transfer-requests/[id]
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id?: string }> }
) {
  const params = await props.params;
  await connectMongoDB();

  const id = params?.id;

  if (!id || typeof id !== "string" || id.trim() === "") {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const request = await TransferRequestModel.findById(id);
    if (!request) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request, { status: 200 });
  } catch (err) {
    console.error("❌ Failed to fetch transfer request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/transfer-requests/[id]
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  await connectMongoDB();
  const updates = await req.json();

  try {
    const prevRequest = await TransferRequestModel.findById(params.id);
    if (!prevRequest) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    // Handle quantity changes
    if (Array.isArray(updates.items)) {
      for (const updatedItem of updates.items as TransferRequestItem[]) {
        const itemCode = updatedItem.itemCode?.trim().toUpperCase();
        const newQty = Number(updatedItem.quantity) || 0;
        if (!itemCode || newQty <= 0) continue;

        const prevItem = prevRequest.items.find(
          (i: TransferRequestItem) =>
            i.itemCode?.trim().toUpperCase() === itemCode
        );
        const prevQty = Number(prevItem?.quantity || 0);

        const delta = newQty - prevQty; // positive → more reserved, negative → release

        const invDoc = await InventoryMain.findOne({
          warehouse: prevRequest.sourceWarehouse.trim().toUpperCase(),
          itemCode,
        });

        if (invDoc) {
          invDoc.availableQuantity = Math.max(
            (invDoc.availableQuantity || 0) - delta,
            0
          );
          invDoc.quantityOnHold = Math.max(
            (invDoc.quantityOnHold || 0) + delta,
            0
          );
          await invDoc.save();
        }
      }
    }

    const request = await TransferRequestModel.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ request }, { status: 200 });
  } catch (err) {
    console.error("❌ Failed to update transfer request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/transfer-requests/[id]
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  await connectMongoDB();

  try {
    const deleted = await TransferRequestModel.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    const warehouseCode = deleted.sourceWarehouse?.trim().toUpperCase();

    // Move reserved quantity back to availableQuantity
    for (const item of deleted.items as TransferRequestItem[]) {
      const itemCode = item.itemCode?.trim().toUpperCase();
      const qty = Number(item.quantity) || 0;
      if (!itemCode || qty <= 0) continue;

      const invDoc = await InventoryMain.findOne({
        warehouse: warehouseCode,
        itemCode,
      });
      if (invDoc) {
        invDoc.availableQuantity = (invDoc.availableQuantity || 0) + qty;
        invDoc.quantityOnHold = Math.max((invDoc.quantityOnHold || 0) - qty, 0);
        await invDoc.save();
        console.log(
          `🔄 Restored ${qty} of ${itemCode} back to available stock (deleted request)`
        );
      }
    }

    return NextResponse.json(
      { message: "Transfer request deleted and stock restored" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Failed to delete transfer request:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
