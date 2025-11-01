import mongoose, { Schema, model, models, HydratedDocument } from "mongoose";
import {
  computeTotalQuantity,
  formatWeight,
  formatCBM,
  computeSubtotal,
} from "../libs/salesOrderMetrics";
import { computeDiscountBreakdown } from "../libs/discountUtils";
import type {
  SalesOrder,
  SalesOrderItem,
} from "../app/components/sections/type";

// 🧩 Item Schema
const ItemSchema = new Schema<SalesOrderItem>(
  {
    itemName: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitType: { type: String, trim: true, uppercase: true },
    price: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    itemCode: { type: String, trim: true, uppercase: true },
    salesPrice: { type: Number },
    weight: { type: Number, default: 0 },
    cbm: { type: Number, default: 0 },
  },
  { _id: true }
);

// 🧾 Sales Order Document Type
export interface SalesOrderDocument extends Omit<SalesOrder, "_id"> {
  _id: mongoose.Types.ObjectId;
  discountBreakdown: {
    rate: number;
    amount: number;
    remaining: number;
  }[];
}

// 🧾 Sales Order Schema
const SalesOrderSchema = new Schema<SalesOrderDocument>(
  {
    soNumber: { type: String, unique: true },
    customer: { type: String, required: true, trim: true, uppercase: true },
    salesPerson: { type: String, required: true, trim: true, uppercase: true },
    warehouse: { type: String, required: true, trim: true, uppercase: true },
    transactionDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    deliveryDate: { type: String, trim: true },
    shippingAddress: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "TO PREPARE", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    items: {
      type: [ItemSchema],
      validate: {
        validator: function (val: SalesOrderItem[]) {
          const so = this as HydratedDocument<SalesOrderDocument>;
          return so.status === "CANCELLED" || val.length > 0;
        },
        message: "At least one item is required unless SO is cancelled",
      },
    },
    discounts: { type: [String], default: [] },
    discountBreakdown: {
      type: [
        {
          rate: { type: Number, required: true },
          amount: { type: Number, required: true },
          remaining: { type: Number, required: true },
        },
      ],
      default: [],
    },
    total: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    formattedWeight: { type: String, default: "0.00 kg" },
    formattedCBM: { type: String, default: "0.000 m³" },
    formattedTotal: { type: String, default: "0.00" },
    formattedNetTotal: { type: String, default: "0.00" },
    creationDate: { type: String, trim: true },
  },
  { timestamps: true }
);

// 🔢 Auto-generate soNumber
SalesOrderSchema.pre("validate", async function (next) {
  const so = this as HydratedDocument<SalesOrderDocument>;
  if (so.soNumber) return next();

  const lastSO = await SalesOrderModel.findOne({})
    .sort({ createdAt: -1 })
    .select("soNumber");

  let nextNumber = 1;
  if (lastSO?.soNumber) {
    const numericPart = lastSO.soNumber.replace(/^SO/, "");
    const parsed = parseInt(numericPart, 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  const padded = String(nextNumber).padStart(10, "0");
  so.soNumber = `SO${padded}`;
  next();
});

// 🧠 Inject computed fields before saving
SalesOrderSchema.pre("save", function (next) {
  const so = this as HydratedDocument<SalesOrderDocument>;

  const items = so.items ?? [];
  const discounts = so.discounts ?? [];

  so.totalQuantity = computeTotalQuantity(items);
  so.formattedWeight = formatWeight(items);
  so.formattedCBM = formatCBM(items);
  so.formattedTotal = computeSubtotal(items);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const { breakdown, formattedNetTotal } = computeDiscountBreakdown(
    totalAmount,
    discounts
  );

  so.discountBreakdown = breakdown;
  so.formattedNetTotal = formattedNetTotal;

  next();
});

// 🧾 Export Model
const SalesOrderModel =
  models.SalesOrder ||
  model<SalesOrderDocument>("SalesOrder", SalesOrderSchema);

export default SalesOrderModel;
