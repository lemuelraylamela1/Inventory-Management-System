import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    item_code: String,
    item_name: String,
    item_description: String,
    item_category: String,
    item_status: String,
    imageUrl: String,
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

export default Item;
