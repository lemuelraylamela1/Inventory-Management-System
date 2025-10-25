import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import InventoryMain from "@/models/inventoryMain";
import Inventory from "@/models/inventory";
import Item from "@/models/item";

async function processTransferItem({
  itemCode,
  quantity,
  unitType,
  sourceWarehouse,
  requestingWarehouse,
}: {
  itemCode: string;
  quantity: number;
  unitType: string;
  sourceWarehouse: string;
  requestingWarehouse: string;
}) {
  const itemDoc = await Item.findOne({ itemCode });
  const itemName = itemDoc?.itemName ?? "Unnamed Item";
  const category = itemDoc?.category ?? "UNCATEGORIZED";

  if (!itemDoc) {
    console.warn(`⚠️ Item not found in catalog: ${itemCode}`);
  }

  // 🔻 Deduct from source warehouse
  await InventoryMain.updateOne(
    { itemCode, warehouse: sourceWarehouse },
    { $inc: { quantity: -quantity } }
  );

  // ✅ Get updated source quantity
  const sourceFinal =
    (await InventoryMain.findOne({ itemCode, warehouse: sourceWarehouse }))
      ?.quantity ?? 0;

  // 📦 Transfer to requesting warehouse
  const destinationExists = await InventoryMain.findOne({
    itemCode,
    warehouse: requestingWarehouse,
  });

  if (destinationExists) {
    await InventoryMain.updateOne(
      { itemCode, warehouse: requestingWarehouse },
      { $inc: { quantity } }
    );
  } else {
    await InventoryMain.updateOne(
      { itemCode, warehouse: requestingWarehouse },
      {
        $set: {
          itemCode,
          itemName,
          unitType,
          quantity,
          warehouse: requestingWarehouse,
        },
      },
      { upsert: true }
    );
  }

  // ✅ Get updated destination quantity
  const destinationFinal =
    (await InventoryMain.findOne({ itemCode, warehouse: requestingWarehouse }))
      ?.quantity ?? quantity;

  // 🧾 Append audit entry to inventory tracker
  await Inventory.updateOne(
    { warehouse: sourceWarehouse },
    {
      $push: {
        items: {
          itemCode,
          itemName,
          category,
          unitType,
          outQty: quantity,
          currentOnhand: sourceFinal,
          particulars: `Transferred to ${requestingWarehouse}`,
          date: new Date().toISOString(),
          receivedAt: new Date(),
        },
      },
    },
    { upsert: true }
  );

  return {
    itemCode,
    source: sourceFinal,
    destination: destinationFinal,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    if (request.status === "APPROVED") {
      return NextResponse.json(
        { error: "Transfer request already approved" },
        { status: 400 }
      );
    }

    const { sourceWarehouse, requestingWarehouse, items } = request;
    const finalQuantities: Record<
      string,
      { source: number; destination: number }
    > = {};

    for (const item of items) {
      const { itemCode, quantity, unitType } = item;
      const result = await processTransferItem({
        itemCode,
        quantity,
        unitType,
        sourceWarehouse,
        requestingWarehouse,
      });
      finalQuantities[result.itemCode] = {
        source: result.source,
        destination: result.destination,
      };
    }

    request.status = "APPROVED";
    await request.save();

    return NextResponse.json(
      { success: true, finalQuantities },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Approval error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
