import mongoose from "mongoose";

export interface InventoryMainItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  quantity: number; // total physical stock
  quantityOnHold: number; // 🧮 quantity pending in sales orders or transfer requests
  availableQuantity: number; // 🆕 free-to-sell stock
  unitType: string;
  updatedAt: Date;
}

const InventoryMainSchema = new mongoose.Schema<InventoryMainItem>({
  itemCode: { type: String, required: true, uppercase: true },
  itemName: { type: String, required: true },
  warehouse: { type: String, required: true, uppercase: true },
  quantity: { type: Number, default: 0 }, // physical stock
  quantityOnHold: { type: Number, default: 0 }, // reserved for pending orders
  availableQuantity: { type: Number, default: 0 }, // free to sell
  unitType: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

// 🧮 Auto-update availableQuantity = total - quantityOnHold
InventoryMainSchema.pre("save", function (next) {
  if (this.isModified("quantity") || this.isModified("quantityOnHold")) {
    this.availableQuantity = Math.max(0, this.quantity - this.quantityOnHold);
  }
  next();
});

export default mongoose.models.InventoryMain ||
  mongoose.model("InventoryMain", InventoryMainSchema);
