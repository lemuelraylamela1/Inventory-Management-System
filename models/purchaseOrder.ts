import mongoose from "mongoose";

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
    },
    referenceNumber: String,
    supplierName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    warehouse: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    remarks: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Auto-generate poNumber before saving
PurchaseOrderSchema.pre("validate", async function (next) {
  if (this.poNumber) return next();

  const lastPO = await mongoose
    .model("PurchaseOrder")
    .findOne({})
    .sort({ createdAt: -1 })
    .select("poNumber");

  let nextNumber = 1;

  if (lastPO?.poNumber) {
    const numericPart = lastPO.poNumber.replace(/^PO/, "");
    const parsed = parseInt(numericPart, 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  const padded = String(nextNumber).padStart(10, "0");
  this.poNumber = `PO${padded}`;

  next();
});

export default mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", PurchaseOrderSchema);
