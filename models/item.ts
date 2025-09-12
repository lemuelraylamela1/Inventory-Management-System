import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItem extends Document {
  createdDT?: string;
  item_code: string;
  item_name: string;
  item_description: string;
  purchasePrice: number;
  salesPrice: number;
  item_category: string;
  item_status: string;
  imageUrl?: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const itemSchema: Schema<IItem> = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    item_code: { type: String, required: true },
    item_name: { type: String, required: true },
    item_description: { type: String, required: true },
    purchasePrice: {
      type: Number,
      required: true,
      set: (v: number) => parseFloat(v.toFixed(2)),
    },
    salesPrice: {
      type: Number,
      required: true,
      set: (v: number) => parseFloat(v.toFixed(2)),
    },
    item_category: { type: String, required: true },
    item_status: { type: String, required: true },
    imageUrl: { type: String },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    weight: { type: Number },
  },
  {
    timestamps: true,
  }
);

// ✅ Composite unique index to prevent duplicate item_code + item_name
itemSchema.index({ item_code: 1, item_name: 1 }, { unique: true });

const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", itemSchema);

export default Item;
