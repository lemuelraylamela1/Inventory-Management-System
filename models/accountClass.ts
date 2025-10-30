export interface AccountClass {
  _id?: string; // MongoDB document ID
  accountClassCode: string; // Unique code, e.g. "AC001"
  accountClassName: string; // Descriptive name, e.g. "Assets"
  description?: string; // Optional notes or classification details
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

import mongoose from "mongoose";

const AccountClassSchema = new mongoose.Schema(
  {
    accountClassCode: { type: String, required: true, unique: true },
    accountClassName: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.AccountClass ||
  mongoose.model("AccountClass", AccountClassSchema);
