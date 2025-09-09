// import mongoose, { Schema } from "mongoose";

// const itemSchema = new Schema(
//   {
//     createdDT: { type: Date, default: Date.now },
//     item_code: String,
//     item_name: String,
//     item_description: String,
//     item_category: String,
//     item_status: String,
//     imageUrl: String,
//     length: Number,
//     width: Number,
//     height: Number,
//     weight: Number,
//   },
//   {
//     timestamps: true,
//   }
// );

// const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

// export default Item;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItem extends Document {
  createdDT?: string;
  item_code: string;
  item_name: string;
  item_description: string;
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

const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", itemSchema);

export default Item;
