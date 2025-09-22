import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitType: {
      type: String,
      trim: true,
      uppercase: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    itemCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      uppercase: true,
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
    items: {
      type: [ItemSchema],
      validate: {
        validator: function (val: { itemName: string }[]) {
          // Cast `this` to the correct document type
          const po = this as mongoose.Document & { status?: string };
          return po.status === "Completed" || val.length > 0;
        },
        message: "At least one item is required unless PO is completed",
      },
    },
    total: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    remarks: String,
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTD", "COMPLETED"],
      default: "PENDING",
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
