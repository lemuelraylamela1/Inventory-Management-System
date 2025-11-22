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
    warehouse: {
      type: String,
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
    items: [
      {
        itemCode: { type: String, required: true, uppercase: true, trim: true },
        description: { type: String, trim: true },
        unitType: { type: String, required: true, uppercase: true, trim: true },
        quantity: { type: Number, required: true, min: 0 }, // qty being returned
        unitPrice: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 }, // quantity * unitPrice
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export default mongoose.models.PurchaseReturn ||
  mongoose.model("PurchaseReturn", PurchaseReturnSchema);
