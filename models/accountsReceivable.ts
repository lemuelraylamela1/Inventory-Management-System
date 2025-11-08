// models/accountReceivable.ts

import mongoose, { Schema, Document } from "mongoose";

export interface AccountsReceivable extends Document {
  voucherNo: string;
  customer: string;
  reference: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountsReceivableSchema = new Schema<AccountsReceivable>(
  {
    voucherNo: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
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
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Optional: Pre-save hook to autogenerate voucherNo
AccountsReceivableSchema.pre("validate", async function (next) {
  if (!this.voucherNo) {
    const last = await mongoose
      .model<AccountsReceivable>("AccountsReceivable")
      .findOne({})
      .sort({ createdAt: -1 })
      .select("voucherNo");

    const lastNumber = last?.voucherNo?.slice(2) || "0000000000";
    const nextNumber = String(Number(lastNumber) + 1).padStart(10, "0");
    this.voucherNo = `AR${nextNumber}`;
  }
  next();
});

export default mongoose.models.AccountsReceivable ||
  mongoose.model("AccountsReceivable", AccountsReceivableSchema);
