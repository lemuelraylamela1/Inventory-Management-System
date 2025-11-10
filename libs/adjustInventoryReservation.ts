import InventoryMainModel from "@/models/inventoryMain";
import type { SalesOrderItem } from "@/app/components/sections/type";

/**
 * Adjusts reserved quantity for inventory items.
 * @param items - Array of SalesOrderItem
 * @param warehouse - Warehouse code
 * @param mode - 'reserve' | 'release' | 'consume'
 */
export async function adjustInventoryReservation(
  items: SalesOrderItem[],
  warehouse: string,
  mode: "reserve" | "release" | "consume"
) {
  const warehouseCode = warehouse.trim().toUpperCase();

  for (const item of items) {
    const itemCode = item.itemCode?.trim().toUpperCase();
    const quantity = item.quantity;

    if (!itemCode || typeof quantity !== "number") continue;

    const update: Record<string, any> = {};

    switch (mode) {
      case "reserve":
        update.$inc = { reserved: quantity };
        break;
      case "release":
        update.$inc = { reserved: -quantity };
        break;
      case "consume":
        update.$inc = { reserved: -quantity, quantity: -quantity };
        break;
      default:
        throw new Error(`Invalid reservation mode: ${mode}`);
    }

    await InventoryMainModel.findOneAndUpdate(
      { itemCode, warehouse: warehouseCode },
      update,
      { new: true }
    );
  }
}
