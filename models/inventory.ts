import mongoose, { Schema, Document, model } from "mongoose";

export interface InventoryItem {
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number; // total movement quantity for this entry
  unitType: string;
  purchasePrice?: number;
  source?: string;
  referenceNumber?: string;
  activity?: string; // e.g., RECEIVED, SOLD, TRANSFERRED
  user?: string;
  inQty?: number; // qty in
  outQty?: number; // qty out
  currentOnhand?: number; // running total after transaction
  quantityOnHold?: number; // 🧮 pending quantity (matches InventoryMain)
  availableQuantity?: number; // 🆕 free to sell (matches InventoryMain)
  particulars?: string;
  date?: string;
  receivedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface InventoryType extends Document {
  warehouse: string;
  items: InventoryItem[];
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryItemSchema = new Schema<InventoryItem>(
  {
    itemCode: { type: String, required: true, trim: true, uppercase: true },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, uppercase: true },
    quantity: { type: Number, required: true },

    unitType: { type: String, required: true, trim: true, uppercase: true },
    purchasePrice: { type: Number, min: 0 },
    source: { type: String, trim: true, uppercase: true },
    referenceNumber: { type: String, trim: true, uppercase: true },

    // ✅ Activity tracking
    activity: { type: String, trim: true, uppercase: true },
    user: { type: String, trim: true },
    inQty: { type: Number, min: 0 },
    outQty: { type: Number, min: 0 },
    currentOnhand: { type: Number, min: 0 },

    // ✅ Synced fields with InventoryMain
    quantityOnHold: { type: Number, default: 0 }, // reserved for pending orders/transfers
    availableQuantity: { type: Number, default: 0 }, // auto = currentOnhand - quantityOnHold

    particulars: { type: String, trim: true },
    date: { type: String, trim: true },
    receivedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// 🧮 Auto-sync availableQuantity before save
InventoryItemSchema.pre("save", function (next) {
  if (this.isModified("quantity") || this.isModified("quantityOnHold")) {
    this.availableQuantity = Math.max(
      0,
      (this.currentOnhand ?? this.quantity) - (this.quantityOnHold ?? 0)
    );
  }
  next();
});

const InventorySchema = new Schema<InventoryType>(
  {
    warehouse: { type: String, required: true, trim: true, uppercase: true },
    items: { type: [InventoryItemSchema], default: [] },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

const Inventory =
  mongoose.models.Inventory ||
  model<InventoryType>("Inventory", InventorySchema);

export default Inventory;
