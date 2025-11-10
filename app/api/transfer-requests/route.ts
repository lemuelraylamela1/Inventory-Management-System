import { NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import { TransferRequestModel } from "@/models/transferRequest";
import { generateStockTransferNo } from "@/libs/generateStockTransferNo";
import type { TransferRequestItem } from "../../components/sections/type";
import Item from "@/models/item";

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
    // 🧾 Validate required fields
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

    // 🔢 Generate request number
    const requestNo = await generateStockTransferNo();

    // 📦 Normalize items and add itemName
    // 📦 Normalize items and include itemName
    const normalizedItems = await Promise.all(
      items
        .filter((item: TransferRequestItem) => Number(item.quantity) > 0)
        .map(async (item: TransferRequestItem) => {
          const code = item.itemCode?.trim().toUpperCase() || "";

          // Lookup item name from inventory
          const inventoryItem = await Item.findOne({ itemCode: code });

          return {
            itemCode: code,
            itemName:
              inventoryItem?.itemName || item.itemName || "UNNAMED ITEM",
            quantity: Math.max(Number(item.quantity) || 1, 1),
            unitType: item.unitType?.trim().toUpperCase() || "",
          };
        })
    );

    // 🧮 Construct payload
    const payload = {
      requestNo,
      requestingWarehouse: requestingWarehouse.trim().toUpperCase(),
      sourceWarehouse: sourceWarehouse.trim().toUpperCase(),
      transactionDate: new Date(transactionDate),
      transferDate: transferDate ? new Date(transferDate) : undefined,
      preparedBy: preparedBy?.trim() || "system",
      reference: reference?.trim() || "",
      notes: notes?.trim() || "",
      items: normalizedItems, // ✅ items now include itemName
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
