import { NextResponse } from "next/server";
import PurchaseOrder from "@/models/purchaseOrder";
import PurchaseReceipt from "@/models/purchaseReceipt";
import Inventory, { InventoryItem } from "@/models/inventory";
import InventoryMain from "@/models/inventoryMain";
import { ReceiptItem, PurchaseOrderItem } from "@/app/components/sections/type";

type PurchaseOrderDocument = {
  _id: string;
  poNumber: string;
  items: PurchaseOrderItem[];
  balance?: number;
  total?: number;
};

async function reconcilePOWithReceipt(
  po: PurchaseOrderDocument,
  receiptItems: ReceiptItem[]
): Promise<void> {
  const originalBalance =
    typeof po.balance === "number" ? po.balance : po.total ?? 0;
  let totalDeducted = 0;

  const updatedItems: PurchaseOrderItem[] = po.items.map((poItem) => {
    const matched = receiptItems.find(
      (receiptItem) =>
        receiptItem.itemCode?.trim().toUpperCase() ===
        poItem.itemCode?.trim().toUpperCase()
    );

    if (matched) {
      const remainingQuantity = Math.max(poItem.quantity - matched.quantity, 0);
      const deductedAmount = matched.quantity * poItem.purchasePrice;
      totalDeducted += deductedAmount;
      return {
        itemCode: poItem.itemCode,
        itemName: poItem.itemName,
        quantity: remainingQuantity,
        unitType: poItem.unitType,
        purchasePrice: poItem.purchasePrice,
      };
    }

    return poItem;
  });

  const sanitizedItems = updatedItems.map(({ amount, ...rest }) => rest);
  const filteredItems = updatedItems.filter((item) => item.quantity > 0);
  const newBalance = Math.max(originalBalance - totalDeducted, 0);
  const newStatus = newBalance === 0 ? "COMPLETED" : "PARTIAL";

  await PurchaseOrder.updateOne(
    { _id: po._id },
    {
      $set: {
        items: sanitizedItems,
        balance: newBalance,
        status: newStatus,
        totalQuantity: filteredItems.reduce(
          (sum: number, item: PurchaseOrderItem) => sum + item.quantity,
          0
        ),
        locked: newStatus === "COMPLETED",
      },
    }
  );

  console.log(
    `📦 PO ${po.poNumber} updated — Status: ${newStatus}, Deducted: ${totalDeducted}, Remaining balance: ${newBalance}`
  );
}

export async function POST(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json();

    const prNumber = (body.prNumber as string)?.trim().toUpperCase();
    const poNumbers = Array.isArray(body.poNumber)
      ? (body.poNumber as string[]).map((po) => po.trim().toUpperCase())
      : [];
    const username = (body.user as string)?.trim() || "SYSTEM";

    if (!prNumber || poNumbers.length === 0) {
      return NextResponse.json(
        { error: "Missing PR number or PO numbers" },
        { status: 400 }
      );
    }

    const receipt = await PurchaseReceipt.findOne({ prNumber });
    if (!receipt) {
      return NextResponse.json(
        { error: `Receipt ${prNumber} not found` },
        { status: 404 }
      );
    }

    await PurchaseReceipt.updateOne(
      { prNumber },
      {
        $set: {
          status: "RECEIVED",
          locked: true,
        },
      }
    );

    const purchaseOrders = await PurchaseOrder.find({
      poNumber: { $in: poNumbers },
    });

    for (const po of purchaseOrders) {
      await reconcilePOWithReceipt(
        po as PurchaseOrderDocument,
        receipt.items ?? []
      );
    }

    for (const item of receipt.items ?? []) {
      const now = new Date();
      const warehouse = receipt.warehouse?.trim().toUpperCase() ?? "";
      const itemCode = item.itemCode?.trim().toUpperCase() ?? "";
      const itemName = item.itemName?.trim() ?? "";
      const unitType = item.unitType?.trim().toUpperCase() ?? "";
      const quantity = Number(item.quantity);

      const inventoryDoc = await Inventory.findOne({ warehouse });

      const newEntry: InventoryItem = {
        itemCode,
        itemName,
        category: item.category ?? "UNCATEGORIZED",
        quantity,
        unitType,
        purchasePrice: item.purchasePrice,
        source: receipt.prNumber,
        referenceNumber: receipt.referenceNumber,
        receivedAt: now,
        createdAt: now,
        updatedAt: now,
        activity: "PURCHASE",
        user: username,
        inQty: quantity,
        outQty: 0,
        currentOnhand: 0,
        particulars: `Received via ${receipt.referenceNumber}`,
        date: now.toISOString(),
      };

      if (!inventoryDoc) {
        newEntry.currentOnhand = quantity;

        await Inventory.create({
          warehouse,
          items: [newEntry],
          remarks: `Auto-created from receipt ${receipt.prNumber}`,
        });

        console.log(`🆕 Created inventory document for ${warehouse}`);
      } else {
        inventoryDoc.items.push(newEntry);

        const totalOnhand = inventoryDoc.items
          .filter((i: InventoryItem) => i.itemName === itemName)
          .reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);

        // Lock past transactions by leaving their currentOnhand untouched
        // Only update the latest transaction
        const latestIndex = inventoryDoc.items.length - 1;
        inventoryDoc.items[latestIndex].currentOnhand = inventoryDoc.items
          .filter((i: InventoryItem) => i.itemName === itemName)
          .reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);

        inventoryDoc.items[inventoryDoc.items.length - 1].currentOnhand =
          totalOnhand;

        await inventoryDoc.save();
        console.log(`📥 Appended transaction for ${itemCode} in ${warehouse}`);
      }

      const totalMainQty = await Inventory.find({ warehouse }).then((docs) =>
        docs
          .flatMap((doc) => doc.items)
          .filter((i: InventoryItem) => i.itemCode === itemCode)
          .reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0)
      );

      await InventoryMain.findOneAndUpdate(
        { itemCode, warehouse },
        {
          $set: {
            itemName,
            unitType,
            quantity: totalMainQty,
            updatedAt: now,
          },
          $setOnInsert: { warehouse },
        },
        { upsert: true }
      );
    }

    console.log(`✅ Receipt ${prNumber} posted and inventory updated.`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error posting receipt:", error);
    return NextResponse.json(
      { error: "Failed to post receipt" },
      { status: 500 }
    );
  }
}
