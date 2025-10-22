import { NextResponse } from "next/server";
import PurchaseReceipt from "@/models/purchaseReceipt";
import PurchaseReturn from "@/models/purchaseReturn";
import { generateNextReturnNumber } from "@/libs/generateNextReturnNumber";
import Inventory, { InventoryItem } from "@/models/inventory";
import InventoryMain from "@/models/inventoryMain";

type ReturnItem = {
  selected?: boolean;
  quantity?: number;
  receiptQty?: number;
  purchasePrice?: number;
  itemCode?: string;
  itemName?: string;
  unitType?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prNumber = body.prNumber?.trim().toUpperCase();
    const reason = body.reason?.trim();
    const notes = body.notes?.trim();
    const status = body.status?.trim().toUpperCase();
    const items: ReturnItem[] = Array.isArray(body.items) ? body.items : [];

    if (!prNumber || !reason) {
      return NextResponse.json(
        { error: "PR number and reason are required." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["RETURNED", "APPROVED", "REJECTED", "CLOSED"];
    const normalizedStatus = allowedStatuses.includes(status)
      ? status
      : "RETURNED";

    const receipt = await PurchaseReceipt.findOne({ prNumber });

    if (!receipt) {
      return NextResponse.json(
        { error: `No purchase receipt found for PR number ${prNumber}.` },
        { status: 404 }
      );
    }

    const validItems = items
      .filter(
        (item) =>
          item.selected === true &&
          Number(item.quantity) >= 1 &&
          Number(item.quantity) <= Number(item.receiptQty)
      )
      .map((item) => {
        const quantity = Number(item.quantity) || 0;
        const purchasePrice = Number(item.purchasePrice) || 0;
        const receiptQty = Number(item.receiptQty) || 0;

        return {
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          itemName: item.itemName?.trim().toUpperCase() || "UNNAMED",
          unitType: item.unitType?.trim().toUpperCase() || "",
          purchasePrice,
          quantity,
          amount: quantity * purchasePrice,
          receiptQty,
          qtyLeft: Math.max(receiptQty - quantity, 0),
        };
      });

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "No valid items selected for return." },
        { status: 400 }
      );
    }

    const receiptQty = validItems.reduce(
      (sum, item) => sum + item.receiptQty,
      0
    );

    const returnedQty = validItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const qtyLeft = Math.max(receiptQty - returnedQty, 0);

    let returnNumber = "PRTN0000000001";
    try {
      returnNumber = await generateNextReturnNumber();
    } catch (err) {
      console.warn("⚠️ Failed to generate return number, using fallback.");
    }

    const newReturn = await PurchaseReturn.create({
      returnNumber,
      prNumber,
      supplierName: receipt.supplierName?.trim().toUpperCase() || "UNKNOWN",
      warehouse: receipt.warehouse?.trim().toUpperCase() || "UNKNOWN",
      reason,
      notes,
      status: normalizedStatus,
      receiptQty,
      qtyLeft,
      items: validItems,
      createdAt: new Date().toISOString(),
    });

    // ✅ Deduct returned quantities from inventory
    for (const item of validItems) {
      const now = new Date();
      const inventoryDoc = await Inventory.findOne({
        warehouse: receipt.warehouse?.trim().toUpperCase(),
      });

      if (!inventoryDoc) {
        console.warn(`⚠️ No inventory document found for ${receipt.warehouse}`);
        continue;
      }

      const previousOnhand = inventoryDoc.items
        .filter((i: InventoryItem) => i.itemCode === item.itemCode)
        .reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);

      const returnEntry: InventoryItem = {
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: "UNCATEGORIZED",
        quantity: -Math.abs(item.quantity),
        unitType: item.unitType,
        purchasePrice: item.purchasePrice,
        source: prNumber,
        referenceNumber: returnNumber,
        receivedAt: now,
        createdAt: now,
        updatedAt: now,
        activity: "RETURNED",
        user: body.user?.trim() || "SYSTEM",
        inQty: 0,
        outQty: item.quantity,
        currentOnhand: previousOnhand - item.quantity,
        particulars: `Returned via ${returnNumber}`,
        date: now.toISOString(),
      };

      inventoryDoc.items.push(returnEntry);
      await inventoryDoc.save();

      await InventoryMain.findOneAndUpdate(
        {
          itemCode: item.itemCode,
          warehouse: receipt.warehouse?.trim().toUpperCase(),
        },
        {
          $inc: { quantity: -Math.abs(item.quantity) },
          $set: {
            itemName: item.itemName,
            unitType: item.unitType,
            updatedAt: now,
          },
          $setOnInsert: {
            warehouse: receipt.warehouse?.trim().toUpperCase(),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json(
      {
        return: newReturn,
        items: receipt.items || [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating purchase return:", error);
    return NextResponse.json(
      { error: "Failed to create purchase return." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const returns = await PurchaseReturn.find().sort({ createdAt: -1 });
    return NextResponse.json(returns, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching purchase returns:", error);
    return NextResponse.json(
      { error: "Failed to retrieve purchase returns" },
      { status: 500 }
    );
  }
}
