// models/inventoryMain.ts
import mongoose from "mongoose";

export interface InventoryMainItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  quantity: number;
  unitType: string;
  updatedAt: Date;
}

const InventoryMainSchema = new mongoose.Schema<InventoryMainItem>({
  itemCode: { type: String, required: true, uppercase: true },
  itemName: { type: String, required: true },
  warehouse: { type: String, required: true, uppercase: true },
  quantity: {
    type: Number,
  },
  unitType: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.InventoryMain ||
  mongoose.model("InventoryMain", InventoryMainSchema);
