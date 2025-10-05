import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
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
  { _id: true } // ✅ mutation tracking
);

const SalesOrderSchema = new mongoose.Schema(
  {
    soNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    salesPerson: {
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
    transactionDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    deliveryDate: {
      type: String,
      trim: true,
    },
    shippingAddress: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "TO PREPARE", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    items: {
      type: [ItemSchema],
      validate: {
        validator: function (val: { itemName: string }[]) {
          const so = this as mongoose.Document & { status?: string };
          return so.status === "CANCELLED" || val.length > 0;
        },
        message: "At least one item is required unless SO is cancelled",
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
  },
  { timestamps: true }
);

// Auto-generate soNumber before saving
SalesOrderSchema.pre("validate", async function (next) {
  if (this.soNumber) return next();

  const lastSO = await mongoose
    .model("SalesOrder")
    .findOne({})
    .sort({ createdAt: -1 })
    .select("soNumber");

  let nextNumber = 1;

  if (lastSO?.soNumber) {
    const numericPart = lastSO.soNumber.replace(/^SO/, "");
    const parsed = parseInt(numericPart, 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  const padded = String(nextNumber).padStart(10, "0");
  this.soNumber = `SO${padded}`;

  next();
});

export default mongoose.models.SalesOrder ||
  mongoose.model("SalesOrder", SalesOrderSchema);
