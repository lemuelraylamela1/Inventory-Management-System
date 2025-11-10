import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import InventoryMain from "@/models/inventoryMain";
import Inventory from "@/models/inventory";
import Item from "@/models/item";
import type { HydratedDocument, Types } from "mongoose";

/* ---------------------------------------------
 * TYPE DEFINITIONS
 * --------------------------------------------- */

interface TransferRequestItem {
  itemCode: string;
  itemName?: string;
  quantity: number | string;
  unitType: string;
}

interface TransferRequestItemSubdoc
  extends TransferRequestItem,
    Types.Subdocument {}

interface TransferRequestDocument {
  _id: Types.ObjectId;
  status: "PENDING" | "APPROVED" | "REJECTED";
  items: TransferRequestItemSubdoc[];
  sourceWarehouse: string;
  requestingWarehouse: string;
  markModified: (path: string) => void;
  save: () => Promise<void>;
}

interface TransferItemInput {
  itemCode: string;
  itemName?: string;
  quantity: number | string;
  unitType: string;
  sourceWarehouse: string;
  requestingWarehouse: string;
}

interface NormalizedTransferItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitType: string;
}

interface ProcessedResult {
  itemCode: string;
  source: number;
  destination: number;
}

/* ---------------------------------------------
 * HELPERS
 * --------------------------------------------- */

function normalizeQuantity(qty: number | string): number {
  const num = Number(qty);
  if (Number.isNaN(num) || num <= 0) {
    throw new Error(`Invalid quantity: ${qty}`);
  }
  return num;
}

async function safeFindItem(itemCode: string) {
  const itemDoc = await Item.findOne({ itemCode });
  return {
    itemName: itemDoc?.itemName ?? "UNNAMED ITEM",
    category: itemDoc?.category ?? "UNCATEGORIZED",
  };
}

/* ---------------------------------------------
 * PROCESS A SINGLE ITEM TRANSFER
 * --------------------------------------------- */

async function processTransferItem({
  itemCode,
  quantity,
  unitType,
  sourceWarehouse,
  requestingWarehouse,
}: TransferItemInput): Promise<ProcessedResult> {
  const qty = normalizeQuantity(quantity);
  const { itemName, category } = await safeFindItem(itemCode);

  /* Deduct from source */
  await InventoryMain.updateOne(
    { itemCode, warehouse: sourceWarehouse },
    { $inc: { quantity: -qty } },
    { upsert: true }
  );

  /* Add to destination */
  await InventoryMain.updateOne(
    { itemCode, warehouse: requestingWarehouse },
    {
      $inc: { quantity: qty },
      $setOnInsert: {
        itemCode,
        itemName,
        unitType,
        warehouse: requestingWarehouse,
      },
    },
    { upsert: true }
  );

  /* Fetch updated quantities */
  const destMain = await InventoryMain.findOne({
    itemCode,
    warehouse: requestingWarehouse,
  });
  const sourceMain = await InventoryMain.findOne({
    itemCode,
    warehouse: sourceWarehouse,
  });

  const destQty = Number(destMain?.quantity) || 0;
  const srcQty = Number(sourceMain?.quantity) || 0;

  const timestamp = new Date();

  /* Tracker entries (quantity included ✅ required by schema) */
  const destinationEntry = {
    itemCode,
    itemName,
    category,
    unitType,
    inQty: qty,
    outQty: 0,
    currentOnhand: destQty,
    quantity: destQty,
    particulars: `Received from ${sourceWarehouse}`,
    activity: "TRANSFER",
    date: timestamp.toISOString(),
    receivedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const sourceEntry = {
    itemCode,
    itemName,
    category,
    unitType,
    inQty: 0,
    outQty: qty,
    currentOnhand: srcQty,
    quantity: srcQty,
    particulars: `Transferred to ${requestingWarehouse}`,
    activity: "TRANSFER",
    date: timestamp.toISOString(),
    receivedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  /* Save inventory tracker logs */
  const destInv = await Inventory.findOne({ warehouse: requestingWarehouse });
  if (!destInv) {
    await Inventory.create({
      warehouse: requestingWarehouse,
      items: [destinationEntry],
      remarks: `Auto-created from transfer from ${sourceWarehouse}`,
    });
  } else {
    destInv.items.push(destinationEntry);
    await destInv.save();
  }

  const srcInv = await Inventory.findOne({ warehouse: sourceWarehouse });
  if (!srcInv) {
    await Inventory.create({
      warehouse: sourceWarehouse,
      items: [sourceEntry],
      remarks: `Auto-created from transfer to ${requestingWarehouse}`,
    });
  } else {
    srcInv.items.push(sourceEntry);
    await srcInv.save();
  }

  return {
    itemCode,
    source: srcQty,
    destination: destQty,
  };
}

/* ---------------------------------------------
 * PATCH — APPROVE TRANSFER REQUEST
 * --------------------------------------------- */

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    await connectMongoDB();

    const requestDoc = (await TransferRequestModel.findById(
      id
    )) as HydratedDocument<TransferRequestDocument> | null;

    if (!requestDoc) {
      return NextResponse.json(
        { error: "Transfer request not found" },
        { status: 404 }
      );
    }

    if (requestDoc.status === "APPROVED") {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }

    /* Normalize items */
    const normalizedItems: NormalizedTransferItem[] = requestDoc.items
      .map((item) => {
        const qty = Number(item.quantity);
        if (qty < 1) return null;

        return {
          itemCode: item.itemCode,
          unitType: item.unitType,
          itemName: item.itemName,
          quantity: qty,
        };
      })
      .filter((i): i is NormalizedTransferItem => i !== null);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: "All items invalid after normalization." },
        { status: 400 }
      );
    }

    /* Process items */
    const results: Record<string, ProcessedResult> = {};

    for (const item of normalizedItems) {
      const result = await processTransferItem({
        ...item,
        sourceWarehouse: requestDoc.sourceWarehouse,
        requestingWarehouse: requestDoc.requestingWarehouse,
      });
      results[item.itemCode] = result;
    }

    /* Update request */
    requestDoc.status = "APPROVED";
    requestDoc.items =
      normalizedItems as unknown as TransferRequestItemSubdoc[];

    requestDoc.markModified("items");
    await requestDoc.save();

    return NextResponse.json(
      { success: true, finalQuantities: results },
      { status: 200 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
