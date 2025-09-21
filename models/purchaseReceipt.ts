import mongoose, { Schema, Document, model } from "mongoose";
import PurchaseOrder from "./purchaseOrder";

export type ReceiptStatus = "draft" | "received" | "cancelled";

export interface ReceiptItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitType: string;
  purchasePrice: number;
  amount: number;
  selected?: boolean; // ✅ Optional flag for frontend filtering
}

export interface PurchaseReceiptType extends Document {
  prNumber: string;
  supplierInvoiceNum: string;
  poNumber: string[];
  amount: number;
  supplierName: string;
  warehouse: string;
  status: ReceiptStatus;
  remarks?: string;
  items?: ReceiptItem[];
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
    items: {
      type: [
        {
          itemCode: { type: String, required: true },
          itemName: { type: String, required: true },
          quantity: { type: Number, required: true },
          unitType: { type: String, required: true },
          purchasePrice: { type: Number, required: true },
          amount: { type: Number, required: true },
        },
      ],
      default: [],
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

      // ✅ Respect frontend-calculated amount if provided
      if (typeof this.amount !== "number" || isNaN(this.amount)) {
        this.amount = Array.isArray(this.items)
          ? this.items.reduce((sum, item) => sum + (item.amount || 0), 0)
          : 0;
      }
    }
  }

  next();
});

const PurchaseReceipt =
  mongoose.models.PurchaseReceipt ||
  model<PurchaseReceiptType>("PurchaseReceipt", PurchaseReceiptSchema);

export default PurchaseReceipt;
