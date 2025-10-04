import mongoose from "mongoose";

export type SalesOrderStatus =
  | "PENDING"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELLED";

const SalesOrderSchema = new mongoose.Schema(
  {
    soNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      uppercase: true,
    },
    creationDate: {
      type: Date,
      required: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
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
