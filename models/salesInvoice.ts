import mongoose, { Schema, model, models } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { SalesInvoice as SalesInvoiceType } from "../app/components/sections/type";
import { generateSalesInvoiceNo } from "@/libs/generateSalesInvoiceNo";

// Define a backend-safe type with Date fields
type SalesInvoiceDoc = HydratedDocument<{
  invoiceNo: string;
  invoiceDate: Date;
  customer: string;
  customerRef?: mongoose.Types.ObjectId;
  salesPerson?: string;
  address?: string;
  TIN?: string;
  terms?: string;
  salesOrder?: mongoose.Types.ObjectId;
  amount: number;
  balance: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "VOID";
  reference?: string;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

const SalesInvoiceItemSchema = new Schema(
  {
    itemCode: { type: String, trim: true, uppercase: true },
    itemName: { type: String, trim: true, uppercase: true },
    description: { type: String, trim: true },
    quantity: { type: Number, min: 1 },
    unitType: { type: String, trim: true, uppercase: true },
    price: { type: Number, min: 0 },
    amount: { type: Number, min: 0 },
  },
  { _id: false } // prevent auto-generating _id for each item
);

const SalesInvoiceSchema = new Schema(
  {
    // Core identifiers
    invoiceNo: {
      type: String,
      unique: true,
    },
    invoiceDate: {
      type: Date,
    },

    // Customer details
    customer: {
      type: String,
      uppercase: true,
      trim: true,
    },
    customerRef: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },
    salesPerson: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    TIN: {
      type: String,
      trim: true,
    },
    terms: {
      type: String,
      trim: true,
    },

    // Linked sales order
    salesOrder: {
      type: String,
      trim: true,
    },

    items: {
      type: [SalesInvoiceItemSchema],
      default: [],
    },

    // Financials
    amount: {
      type: Number,
      min: 0,
    },
    balance: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID", "VOID"],
      default: "UNPAID",
    },

    // Metadata
    reference: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔢 Auto-generate invoiceNo: SI0000000001, SI0000000002, ...
SalesInvoiceSchema.pre("save", async function (next) {
  const doc = this as SalesInvoiceDoc;

  if (doc.isNew && !doc.invoiceNo) {
    doc.invoiceNo = await generateSalesInvoiceNo();
  }

  next();
});

export const SalesInvoice =
  models.SalesInvoice || model("SalesInvoice", SalesInvoiceSchema);
