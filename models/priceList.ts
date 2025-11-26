import mongoose, { Schema, Document, models } from "mongoose";

export interface PriceListItem {
  itemCode: string;
  itemName: string;
  salesPrice: number;
}

export interface PriceList extends Document {
  priceLevelCode: string;
  priceLevelName: string;
  items: PriceListItem[];
  createdAt: Date;
  updatedAt: Date;
}

const PriceListItemSchema = new Schema<PriceListItem>({
  itemCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  salesPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const PriceListSchema = new Schema<PriceList>(
  {
    priceLevelCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    priceLevelName: {
      type: String,
      required: true,
      trim: true,
    },

    items: {
      type: [PriceListItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const PriceListModel =
  models.PriceList || mongoose.model<PriceList>("PriceList", PriceListSchema);

export default PriceListModel;
