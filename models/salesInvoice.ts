import mongoose, { Schema, model, models } from "mongoose";

const SalesInvoiceSchema = new Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        const sequence = Date.now().toString().slice(-10);
        return `SI${sequence}`;
      },
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    customer: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    salesOrder: {
      type: Schema.Types.ObjectId,
      ref: "SalesOrder",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID", "VOID"],
      default: "UNPAID",
    },
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

    // Optional fields resolved from Customer DB
    TIN: { type: String, trim: true },
    terms: { type: String, trim: true },
    salesPerson: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const SalesInvoice =
  models.SalesInvoice || model("SalesInvoice", SalesInvoiceSchema);
