import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import InventoryMain from "@/models/inventoryMain";
import Inventory from "@/models/inventory";
import Item from "@/models/item";
import { InventoryItem } from "../../../../components/sections/type";

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
  const itemName = itemDoc?.itemName ?? "UNNAMED ITEM";
  const category = itemDoc?.category ?? "UNCATEGORIZED";

  if (!itemDoc) {
    console.warn(`⚠️ Item not found in catalog: ${itemCode}`);
  }

  // 🔻 Deduct from source warehouse
  await InventoryMain.updateOne(
    { itemCode, warehouse: sourceWarehouse },
    { $inc: { quantity: -quantity } },
    { upsert: true }
  );

  // 📦 Transfer to requesting warehouse
  await InventoryMain.updateOne(
    { itemCode, warehouse: requestingWarehouse },
    {
      $inc: { quantity },
      $setOnInsert: {
        itemCode,
        itemName,
        unitType,
        warehouse: requestingWarehouse,
      },
    },
    { upsert: true }
  );

  // ✅ Fetch updated destination quantity AFTER transfer
  const destinationMainDoc = await InventoryMain.findOne({
    itemCode,
    warehouse: requestingWarehouse,
  });
  const updatedDestinationQuantity = Number(destinationMainDoc?.quantity) || 0;

  // 🧾 Log destination-side tracker entry
  const destinationTrackerEntry = {
    itemCode,
    itemName,
    category,
    unitType,
    inQty: quantity,
    outQty: 0,
    currentOnhand: updatedDestinationQuantity,
    particulars: `Received from ${sourceWarehouse}`,
    activity: "TRANSFER",
    date: new Date().toISOString(),
    receivedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const destinationInventoryDoc = await Inventory.findOne({
    warehouse: requestingWarehouse,
  });

  if (!destinationInventoryDoc) {
    await Inventory.create({
      warehouse: requestingWarehouse,
      items: [destinationTrackerEntry],
      remarks: `Auto-created from transfer from ${sourceWarehouse}`,
    });
    console.log(`🆕 Created inventory tracker for ${requestingWarehouse}`);
  } else {
    destinationInventoryDoc.items.push(destinationTrackerEntry);
    await destinationInventoryDoc.save();
    console.log(`📥 Logged receipt for ${itemCode} in ${requestingWarehouse}`);
  }

  // ✅ Fetch updated source quantity AFTER deduction
  const sourceMainDoc = await InventoryMain.findOne({
    itemCode,
    warehouse: sourceWarehouse,
  });
  const updatedSourceQuantity = Number(sourceMainDoc?.quantity) || 0;

  console.log(
    `📦 Updated InventoryMain quantity for ${itemCode} in ${sourceWarehouse}: ${updatedSourceQuantity}`
  );

  // 🧾 Log source-side tracker entry
  const sourceTrackerEntry = {
    itemCode,
    itemName,
    category,
    unitType,
    inQty: 0,
    outQty: quantity,
    currentOnhand: updatedSourceQuantity,
    particulars: `Transferred to ${requestingWarehouse}`,
    activity: "TRANSFER",
    date: new Date().toISOString(),
    receivedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sourceInventoryDoc = await Inventory.findOne({
    warehouse: sourceWarehouse,
  });

  if (!sourceInventoryDoc) {
    await Inventory.create({
      warehouse: sourceWarehouse,
      items: [sourceTrackerEntry],
      remarks: `Auto-created from transfer to ${requestingWarehouse}`,
    });
    console.log(`🆕 Created inventory tracker for ${sourceWarehouse}`);
  } else {
    sourceInventoryDoc.items.push(sourceTrackerEntry);
    await sourceInventoryDoc.save();
    console.log(`📤 Logged transfer for ${itemCode} in ${sourceWarehouse}`);
  }

  return {
    itemCode,
    source: updatedSourceQuantity,
    destination: updatedDestinationQuantity,
  };
}

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
