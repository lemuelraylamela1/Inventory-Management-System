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

const SalesInvoiceSchema = new Schema(
  {
    // Core identifiers
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },

    // Customer details
    customer: {
      type: String,
      required: true,
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
      type: Schema.Types.ObjectId,
      ref: "SalesOrder",
    },

    // Financials
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
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
