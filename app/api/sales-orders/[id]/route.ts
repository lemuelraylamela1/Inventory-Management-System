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
    address,
    contactNumber,
    salesPerson,
    warehouse,
    transactionDate,
    deliveryDate,
    shippingAddress,
    notes,
    status,
    items,
  } = payload;

  // Normalize items
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
      (sum, i) => sum + (i.quantity ?? 0),
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

    const warehouseCode = order.warehouse?.trim().toUpperCase();

    // 🔁 1️⃣ Handle CANCELLATION: return on-hold back to available
    if (previousOrder?.status !== "CANCELLED" && order.status === "CANCELLED") {
      for (const item of previousOrder.items) {
        const itemCode = item.itemCode?.trim().toUpperCase();
        const qty = Number(item.quantity) || 0;
        if (!itemCode || qty <= 0) continue;

        try {
          const mainDoc = await InventoryMain.findOne({
            itemCode,
            warehouse: warehouseCode,
          });
          if (mainDoc) {
            mainDoc.availableQuantity =
              (Number(mainDoc.availableQuantity) || 0) + qty;
            mainDoc.quantityOnHold = Math.max(
              (Number(mainDoc.quantityOnHold) || 0) - qty,
              0
            );
            await mainDoc.save();
          }
        } catch (err) {
          console.error(`❌ Failed to restore inventory for ${itemCode}:`, err);
        }
      }
    }

    // 🔁 2️⃣ Update quantities if TO PREPARE or PENDING (move stock to on-hold)
    if (["TO PREPARE", "PENDING"].includes(order.status || "")) {
      for (const item of normalizedItems) {
        const itemCode = item.itemCode?.trim().toUpperCase();
        const newQty = Number(item.quantity) || 0;
        if (!itemCode || newQty <= 0) continue;

        try {
          const mainDoc = await InventoryMain.findOne({
            itemCode,
            warehouse: warehouseCode,
          });
          if (mainDoc) {
            // Compute previous quantity for this item
            const prevItem = previousOrder?.items.find(
              (i: SalesOrderItem) =>
                i.itemCode?.trim().toUpperCase() === itemCode
            );

            const prevQty = Number(prevItem?.quantity) || 0;

            // Difference between new and old
            const diff = newQty - prevQty;

            mainDoc.availableQuantity = Math.max(
              (Number(mainDoc.availableQuantity) || 0) - diff,
              0
            );
            mainDoc.quantityOnHold =
              (Number(mainDoc.quantityOnHold) || 0) + diff;
            await mainDoc.save();
          }
        } catch (err) {
          console.error(
            `❌ Failed to update on-hold inventory for ${itemCode}:`,
            err
          );
        }
      }
    }

    // 🔁 3️⃣ COMPLETED: consume from on-hold and log inventory tracker
    // ✅ 3️⃣ If status changes to COMPLETED: consume from onHold and log inventory
    if (previousOrder?.status !== "COMPLETED" && order.status === "COMPLETED") {
      const now = new Date();
      for (const item of order.items) {
        const itemCode = item.itemCode?.trim().toUpperCase();
        const qty = Math.max(Number(item.quantity) || 0, 0);
        if (!itemCode || qty <= 0) continue;

        try {
          // Update InventoryMain
          const mainDoc = await InventoryMain.findOne({
            itemCode,
            warehouse: warehouseCode,
          });
          if (mainDoc) {
            mainDoc.quantityOnHold = Math.max(
              (Number(mainDoc.quantityOnHold) || 0) - qty,
              0
            );
            mainDoc.quantity = Math.max((mainDoc.quantity || 0) - qty, 0);
            await mainDoc.save();
          }

          // Log movement in Inventory tracker
          let inventoryDoc = await Inventory.findOne({
            warehouse: warehouseCode,
          });
          if (!inventoryDoc) {
            inventoryDoc = new Inventory({
              warehouse: warehouseCode,
              items: [],
            });
          }

          const prevOnhand = inventoryDoc.items
            .filter((i: InventoryItem) => i.itemCode === itemCode)
            .reduce(
              (sum: number, i: InventoryItem) =>
                sum + ((i.inQty || 0) - (i.outQty || 0)),
              0
            );

          const logEntry = {
            itemCode,
            itemName: item.itemName?.trim().toUpperCase(),
            category: "SOLD",
            quantity: qty,
            unitType: item.unitType?.trim().toUpperCase() || "",
            source: order.soNumber,
            referenceNumber: order.soNumber,
            activity: "SALE",
            user: "SYSTEM",
            inQty: 0,
            outQty: qty,
            currentOnhand: Math.max(prevOnhand - qty, 0),
            particulars: `Sold via ${order.soNumber}`,
            date: now.toISOString(),
            receivedAt: now,
            createdAt: now,
            updatedAt: now,
          };

          inventoryDoc.items.push(logEntry);
          await inventoryDoc.save();
        } catch (err) {
          console.error(`❌ Failed to log sale for ${itemCode}:`, err);
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

    const warehouseCode = deleted.warehouse?.trim().toUpperCase();

    // 🔁 1️⃣ Return all quantityOnHold back to availableQuantity
    for (const item of deleted.items) {
      const itemCode = item.itemCode?.trim().toUpperCase();
      const qty = Number(item.quantity) || 0;
      if (!itemCode || qty <= 0) continue;

      try {
        const updated = await InventoryMain.findOneAndUpdate(
          { itemCode, warehouse: warehouseCode },
          {
            $inc: { availableQuantity: qty, quantityOnHold: -qty },
          },
          { new: true }
        );

        if (updated) {
          let changed = false;
          if ((updated.availableQuantity ?? 0) < 0) {
            updated.availableQuantity = 0;
            changed = true;
          }
          if ((updated.quantityOnHold ?? 0) < 0) {
            updated.quantityOnHold = 0;
            changed = true;
          }
          if (changed) await updated.save();

          console.log(
            `🔄 Restored ${qty} of ${itemCode} back to available stock (deleted SO)`
          );
        }
      } catch (err) {
        console.error(`❌ Failed to restore stock for ${itemCode}:`, err);
      }
    }

    // ✅ 2️⃣ If the order was COMPLETED, quantities are already consumed
    if (deleted.status === "COMPLETED") {
      console.log(
        `ℹ️ Deleted a completed order — inventory already consumed, no stock restored.`
      );
    }

    console.log(`🗑️ Deleted sales order ${trimmedId}`);
    return NextResponse.json(
      { message: "Sales order deleted and stock restored" },
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
