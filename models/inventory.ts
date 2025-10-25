import mongoose, { Schema, Document, model } from "mongoose";

export interface InventoryItem {
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unitType: string;
  purchasePrice?: number;
  source?: string;
  referenceNumber?: string;
  activity?: string;
  user?: string;
  inQty?: number;
  outQty?: number;
  currentOnhand?: number;
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
    quantity: { type: Number },
    unitType: { type: String, required: true, trim: true, uppercase: true },
    purchasePrice: { type: Number, min: 0 },
    source: { type: String, trim: true, uppercase: true },
    referenceNumber: { type: String, trim: true, uppercase: true },

    // ✅ Activity tracking fields
    activity: { type: String, trim: true, uppercase: true },
    user: { type: String, trim: true },
    inQty: { type: Number, min: 0 },
    outQty: { type: Number, min: 0 },
    currentOnhand: { type: Number, min: 0 },
    particulars: { type: String, trim: true },
    date: { type: String, trim: true },

    receivedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
