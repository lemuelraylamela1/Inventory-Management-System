import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/libs/mongodb";
import SalesOrderModel from "@/models/salesOrder";
import { Types } from "mongoose";
import type {
  SalesOrder,
  SalesOrderItem,
} from "../../../components/sections/type";
import InventoryMain from "@/models/inventoryMain";
import Inventory from "@/models/inventory";
import { InventoryItem } from "../../../components/sections/type";

// ✅ GET /api/sales-orders/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  await connectMongoDB();

  const { id } = await context.params; // ✅ await the params
  const trimmedId = id?.trim();

  if (!trimmedId || !Types.ObjectId.isValid(trimmedId)) {
    return NextResponse.json(
      { message: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  try {
    const order = await SalesOrderModel.findById(trimmedId);
    if (!order) {
      return NextResponse.json(
        { message: "Sales order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching sales order:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ PATCH /api/sales-orders/[id]
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  await connectMongoDB();

  const id = params.id?.trim();
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  let payload: Partial<SalesOrder>;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("❌ Failed to parse JSON:", err);
    return NextResponse.json(
      { error: "Malformed request body" },
      { status: 400 }
    );
  }

  const {
    customer,
    salesPerson,
    warehouse,
    transactionDate,
    deliveryDate,
    shippingAddress,
    notes,
    status,
    items,
  } = payload;

  const normalizedItems: SalesOrderItem[] = Array.isArray(items)
    ? items
        .filter((item) => Number(item.quantity) > 0)
        .map((item) => ({
          itemName: item.itemName?.trim().toUpperCase() || "",
          quantity: Math.max(Number(item.quantity) || 1, 1),
          unitType: item.unitType?.trim().toUpperCase() || "",
          price: Number(item.price) || 0,
          itemCode: item.itemCode?.trim().toUpperCase() || "",
          description: item.description?.trim() || "",
          amount: Number(item.quantity) * Number(item.price),
        }))
    : [];

  const isInvalid =
    (customer && typeof customer !== "string") ||
    (salesPerson && typeof salesPerson !== "string") ||
    (warehouse && typeof warehouse !== "string") ||
    (transactionDate && typeof transactionDate !== "string") ||
    (deliveryDate && typeof deliveryDate !== "string") ||
    (shippingAddress && typeof shippingAddress !== "string") ||
    (notes && typeof notes !== "string") ||
    (status &&
      !["PENDING", "TO PREPARE", "COMPLETED", "CANCELLED"].includes(status)) ||
    (items &&
      (!Array.isArray(items) ||
        normalizedItems.some(
          (item) =>
            typeof item.itemName !== "string" ||
            isNaN(item.quantity ?? NaN) ||
            isNaN(item.price ?? NaN) ||
            isNaN(item.amount ?? NaN)
        )));

  if (isInvalid) {
    return NextResponse.json(
      { error: "Invalid update payload" },
      { status: 400 }
    );
  }

  const updatePayload: Partial<SalesOrder> = {
    customer: customer?.trim().toUpperCase(),
    salesPerson: salesPerson?.trim().toUpperCase(),
    warehouse: warehouse?.trim().toUpperCase(),
    transactionDate,
    deliveryDate,
    shippingAddress: shippingAddress?.trim(),
    notes: notes?.trim(),
    status,
  };

  if (normalizedItems.length > 0) {
    updatePayload.items = normalizedItems;
    updatePayload.total = normalizedItems.reduce((sum, i) => sum + i.amount, 0);
    updatePayload.totalQuantity = normalizedItems.reduce(
      (sum, i) => sum + sum + (i.quantity ?? 0),
      0
    );
  }

  try {
    const previousOrder = await SalesOrderModel.findById(id);
    const order = await SalesOrderModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    if (previousOrder?.status !== "COMPLETED" && order.status === "COMPLETED") {
      const warehouseCode = order.warehouse?.trim().toUpperCase();
      const soNumber = order.soNumber;
      const now = new Date();

      if (!warehouseCode) {
        console.warn(`⚠️ No warehouse found in sales order ${soNumber}`);
      } else {
        for (const item of order.items) {
          const itemCode = item.itemCode?.trim().toUpperCase();
          const quantity = Math.max(Number(item.quantity) || 0, 0);

          if (!itemCode || quantity <= 0) {
            console.warn(
              `⚠️ Skipping invalid item: ${item.itemName} (${itemCode})`
            );
            continue;
          }

          // 📉 Deduct from InventoryMain with fallback
          try {
            const mainDoc = await InventoryMain.findOne({
              itemCode,
              warehouse: warehouseCode,
            });
            if (!mainDoc) {
              console.warn(
                `⚠️ InventoryMain not found for ${itemCode} in ${warehouseCode}`
              );
            } else {
              const currentQty = Number(mainDoc.quantity) || 0;
              const newQty = Math.max(currentQty - quantity, 0);
              mainDoc.quantity = newQty;
              await mainDoc.save();
              console.log(
                `📉 InventoryMain updated for ${itemCode}: ${currentQty} → ${newQty}`
              );
            }
          } catch (err) {
            console.error(
              `❌ InventoryMain update failed for ${itemCode}:`,
              err
            );
          }

          // 📦 Log to Inventory tracker with correct currentOnhand
          try {
            const inventoryDoc = await Inventory.findOne({
              warehouse: warehouseCode,
            });

            const newEntry = {
              itemCode,
              itemName: item.itemName?.trim().toUpperCase(),
              category: "SOLD",
              quantity: -quantity,
              unitType: item.unitType?.trim().toUpperCase() || "",
              source: soNumber,
              referenceNumber: soNumber,
              activity: "SALE",
              user: "SYSTEM",
              inQty: 0,
              outQty: quantity,
              currentOnhand: 0,
              particulars: `Sold via ${soNumber}`,
              date: now.toISOString(),
              receivedAt: now,
              createdAt: now,
              updatedAt: now,
            };

            if (!inventoryDoc) {
              newEntry.currentOnhand = -quantity;
              await Inventory.create({
                warehouse: warehouseCode,
                items: [newEntry],
                remarks: `Auto-created from sales order ${soNumber}`,
              });
              console.log(`🆕 Created inventory tracker for ${warehouseCode}`);
            } else {
              const previousOnhand = inventoryDoc.items
                .filter((i: InventoryItem) => i.itemCode === itemCode)
                .reduce((sum: number, i: InventoryItem) => {
                  const inQty = Number(i.inQty) || 0;
                  const outQty = Number(i.outQty) || 0;
                  return sum + (inQty - outQty);
                }, 0);

              const currentOnhand = previousOnhand - quantity;
              newEntry.currentOnhand = isNaN(currentOnhand) ? 0 : currentOnhand;

              inventoryDoc.items.push(newEntry);
              await inventoryDoc.save();

              console.log(
                `📤 Logged sale for ${itemCode} in ${warehouseCode} | previousOnhand=${previousOnhand}, deducted=${quantity}, currentOnhand=${newEntry.currentOnhand}`
              );
            }
          } catch (err) {
            console.error(
              `❌ Failed to log inventory tracker for ${itemCode}:`,
              err
            );
          }
        }
      }
    }

    return NextResponse.json({ message: "Sales order updated", order });
  } catch (error) {
    console.error("❌ Error updating sales order:", error);
    return NextResponse.json(
      { error: "Failed to update sales order" },
      { status: 500 }
    );
  }
}

// ✅ DELETE /api/sales-orders/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectMongoDB();
  const { id } = await context.params;
  const trimmedId = id?.trim();

  if (!trimmedId || !Types.ObjectId.isValid(trimmedId)) {
    return NextResponse.json(
      { error: "Invalid sales order ID" },
      { status: 400 }
    );
  }

  try {
    const deleted = await SalesOrderModel.findByIdAndDelete(trimmedId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    console.log(`🗑️ Deleted sales order ${trimmedId}`);
    return NextResponse.json(
      { message: "Sales order deleted" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error deleting sales order:", err);
    return NextResponse.json(
      { error: "Failed to delete sales order" },
      { status: 500 }
    );
  }
}
