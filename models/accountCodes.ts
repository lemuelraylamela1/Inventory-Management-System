import mongoose, { Schema, Document, model } from "mongoose";

export interface AccountCodeDocument extends Document {
  accountCode: string;
  accountName: string;
  salesAccount: string;
  purchaseAccount: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountCodeSchema = new Schema<AccountCodeDocument>(
  {
    accountCode: { type: String, required: true, trim: true },
    accountName: { type: String, required: true, trim: true },
    salesAccount: { type: String, required: true, trim: true },
    purchaseAccount: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.AccountCode ||
  model<AccountCodeDocument>("AccountCode", AccountCodeSchema);
