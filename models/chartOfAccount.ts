// models/chartOfAccount.ts

import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ChartOfAccount extends Document {
  accountCode: string;
  accountName: string;
  accountClass: string;
  status: string;
  accountType: string;
  fsPresentation: string;
  parentAccountTitle?: string;
  accountNature: string;
  createdAt: Date;
  updatedAt: Date;
}

const chartOfAccountSchema = new Schema<ChartOfAccount>(
  {
    accountCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    accountClass: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    accountType: {
      type: String,
      required: true,
    },
    fsPresentation: {
      type: String,
      required: true,
    },
    parentAccountTitle: {
      type: String,
      trim: true,
      default: null,
    },
    accountNature: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default models.ChartOfAccount ||
  model("ChartOfAccount", chartOfAccountSchema);
