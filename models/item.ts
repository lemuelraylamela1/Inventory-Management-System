import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItem extends Document {
  createdDT?: Date;
  itemCode: { type: string; required: true };
  itemName: { type: string; required: true };
  description: { type: string; required: true };
  purchasePrice: { type: number; required: true };
  salesPrice: { type: number; required: true };
  category: { type: string; required: true };
  status: { type: string; required: true };
  imageUrl?: { type: string; required: true };
  length?: { type: number; required: true };
  width?: { type: number; required: true };
  height?: { type: number; required: true };
  weight?: { type: number; required: true };
  createdAt?: Date;
  updatedAt?: Date;
}

const itemSchema: Schema<IItem> = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    itemCode: { type: String, required: true },
    itemName: { type: String, required: true },
    description: { type: String, required: true },
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
    category: { type: String, required: true },
    status: { type: String, required: true },
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

// ✅ Composite unique index to prevent duplicate itemCode + itemName
itemSchema.index({ itemCode: 1, itemName: 1 }, { unique: true });

const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", itemSchema);

export default Item;
