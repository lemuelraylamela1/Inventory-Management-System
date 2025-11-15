import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import { generateStockTransferNo } from "@/libs/generateStockTransferNo";
import type { TransferRequestItem } from "../../components/sections/type";
import Item from "@/models/item";
import InventoryMain from "@/models/inventoryMain";

export async function POST(req: Request) {
  await connectMongoDB();
  const body = await req.json();

  const {
    requestingWarehouse,
    sourceWarehouse,
    transactionDate,
    transferDate,
    preparedBy,
    reference,
    notes,
    items,
  } = body;

  try {
    if (
      !requestingWarehouse ||
      !sourceWarehouse ||
      !transactionDate ||
      !items?.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const requestNo = await generateStockTransferNo();

    // Normalize items
    const normalizedItems = await Promise.all(
      items
        .filter((item: TransferRequestItem) => Number(item.quantity) > 0)
        .map(async (item: TransferRequestItem) => {
          const code = item.itemCode?.trim().toUpperCase() || "";
          const inventoryItem = await Item.findOne({ itemCode: code });

          const qty = Math.max(Number(item.quantity) || 1, 1);

          // 🔁 Update inventory: move from availableQuantity → quantityOnHold
          if (code) {
            const invDoc = await InventoryMain.findOne({
              warehouse: sourceWarehouse.trim().toUpperCase(),
              itemCode: code,
            });
            if (invDoc) {
              invDoc.availableQuantity = Math.max(
                (invDoc.availableQuantity || 0) - qty,
                0
              );
              invDoc.quantityOnHold = (invDoc.quantityOnHold || 0) + qty;
              await invDoc.save();
              console.log(`Moved ${qty} of ${code} to quantityOnHold`);
            }
          }

          return {
            itemCode: code,
            itemName:
              inventoryItem?.itemName || item.itemName || "UNNAMED ITEM",
            quantity: qty,
            unitType: item.unitType?.trim().toUpperCase() || "",
          };
        })
    );

    const payload = {
      requestNo,
      requestingWarehouse: requestingWarehouse.trim().toUpperCase(),
      sourceWarehouse: sourceWarehouse.trim().toUpperCase(),
      transactionDate: new Date(transactionDate),
      transferDate: transferDate ? new Date(transferDate) : undefined,
      preparedBy: preparedBy?.trim() || "system",
      reference: reference?.trim() || "",
      notes: notes?.trim() || "",
      items: normalizedItems,
      status: "PENDING",
    };

    const request = await TransferRequestModel.create(payload);

    return NextResponse.json({ request }, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  await connectMongoDB();
  try {
    const requests = await TransferRequestModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ requests });
  } catch (err) {
    console.error("❌ Failed to fetch transfer requests:", err);
    return NextResponse.json(
      { error: "Failed to fetch transfer requests" },
      { status: 500 }
    );
  }
}
