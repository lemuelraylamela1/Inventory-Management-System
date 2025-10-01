import mongoose from "mongoose";

const PurchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true, // e.g. PRTN0000000001
      uppercase: true,
      trim: true,
    },
    prNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    supplierName: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["RETURNED", "APPROVED", "REJECTED", "CLOSED"],
      default: "RETURNED",
      uppercase: true,
      trim: true,
    },
    receiptQty: {
      type: Number,
      required: true,
      min: 0,
    },
    qtyLeft: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export default mongoose.models.PurchaseReturn ||
  mongoose.model("PurchaseReturn", PurchaseReturnSchema);
