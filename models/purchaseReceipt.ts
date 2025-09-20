import mongoose, { Schema, Document, model } from "mongoose";
import PurchaseOrder from "./purchaseOrder";

export interface PurchaseReceiptType extends Document {
  prNumber: string;
  supplierInvoiceNum: string;
  poNumber: string[];
  amount: number;
  supplierName: string;
  warehouse: string;
  status: "draft" | "received" | "cancelled";
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Utility: Generate next PR number (e.g. PR0000000123)
async function generateNextPRNumber(): Promise<string> {
  const latest = await PurchaseReceipt.findOne().sort({ createdAt: -1 });
  const lastNum = latest?.prNumber?.match(/\d+$/)?.[0] || "0";
  const nextNum = String(Number(lastNum) + 1).padStart(10, "0");
  return `PR${nextNum}`;
}

const PurchaseReceiptSchema = new Schema<PurchaseReceiptType>(
  {
    prNumber: {
      type: String,
      unique: true,
    },
    supplierInvoiceNum: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    poNumber: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length > 0,
        "At least one PO is required",
      ],
    },
    amount: {
      type: Number,
      min: 0,
    },
    supplierName: {
      type: String,
      trim: true,
      uppercase: true,
    },
    warehouse: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["draft", "received", "cancelled"],
      default: "draft",
      lowercase: true,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate prNumber and enrich fields
PurchaseReceiptSchema.pre("validate", async function (next) {
  if (!this.prNumber) {
    this.prNumber = await generateNextPRNumber();
  }

  if (Array.isArray(this.poNumber) && this.poNumber.length > 0) {
    const pos = await PurchaseOrder.find({
      poNumber: { $in: this.poNumber.map((po) => po.trim().toUpperCase()) },
    });

    if (pos.length > 0) {
      this.supplierName =
        pos[0].supplierName?.trim().toUpperCase() || "UNKNOWN";
      this.warehouse = pos[0].warehouse?.trim().toUpperCase() || "UNKNOWN";
      this.amount = pos.reduce((sum, po) => sum + (po.total || 0), 0);
    }
  }

  next();
});

const PurchaseReceipt =
  mongoose.models.PurchaseReceipt ||
  model<PurchaseReceiptType>("PurchaseReceipt", PurchaseReceiptSchema);

export default PurchaseReceipt;
