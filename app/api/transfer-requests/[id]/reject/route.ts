import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import InventoryMain from "@/models/inventoryMain";
import Item from "@/models/item";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  try {
    await connectMongoDB();
    const { id } = params;

    const request = await TransferRequestModel.findById(id);
    if (!request) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    if (request.status === "REJECTED") {
      return NextResponse.json({ error: "Already rejected" }, { status: 400 });
    }

    // Only adjust inventory if the request was previously PENDING or APPROVED
    if (request.status === "PENDING") {
      const sourceWarehouse = request.sourceWarehouse.trim().toUpperCase();

      for (const item of request.items) {
        const itemCode = item.itemCode.trim().toUpperCase();
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) continue;

        try {
          const inventoryDoc = await InventoryMain.findOne({
            itemCode,
            warehouse: sourceWarehouse,
          });
          if (inventoryDoc) {
            // Move quantity from quantityOnHold back to availableQuantity
            inventoryDoc.availableQuantity =
              (inventoryDoc.availableQuantity || 0) + qty;
            inventoryDoc.quantityOnHold = Math.max(
              (inventoryDoc.quantityOnHold || 0) - qty,
              0
            );
            await inventoryDoc.save();
          }
        } catch (err) {
          console.error(`❌ Failed to restore inventory for ${itemCode}:`, err);
        }
      }
    }

    // Mark as rejected
    request.status = "REJECTED";
    await request.save();

    return NextResponse.json(
      {
        success: true,
        message: "Transfer request rejected and inventory restored",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Rejection error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
