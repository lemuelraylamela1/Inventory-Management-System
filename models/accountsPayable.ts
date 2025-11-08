import mongoose, { Schema, Document } from "mongoose";

export interface AccountsPayable extends Document {
  voucherNo: string;
  supplier: string;
  reference: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountsPayableSchema = new Schema<AccountsPayable>(
  {
    voucherNo: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
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
AccountsPayableSchema.pre("validate", async function (next) {
  if (!this.voucherNo) {
    const Model =
      mongoose.models.AccountsPayable ||
      mongoose.model("AccountsPayable", AccountsPayableSchema);

    const last = await Model.findOne({})
      .sort({ createdAt: -1 })
      .select("voucherNo");
    const lastNumber = last?.voucherNo?.slice(2) || "0000000000";
    const nextNumber = String(Number(lastNumber) + 1).padStart(10, "0");
    this.voucherNo = `AP${nextNumber}`;
  }
  next();
});

export default mongoose.models.AccountsPayable ||
  mongoose.model("AccountsPayable", AccountsPayableSchema);
