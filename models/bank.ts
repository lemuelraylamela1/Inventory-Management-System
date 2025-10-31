import mongoose, { Schema, Document, model } from "mongoose";

export interface BankDocument extends Document {
  bankAccountName: string;
  bankAccountCode: string;
  bankAccountNumber: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const BankSchema = new Schema<BankDocument>(
  {
    bankAccountName: { type: String, required: true, trim: true },
    bankAccountCode: { type: String, required: true, trim: true },
    bankAccountNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Bank || model<BankDocument>("Bank", BankSchema);
