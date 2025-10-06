import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICustomerType extends Document {
  groupCode: string;
  groupName: string;
  discounts: number[];
  createdAt?: Date;
  updatedAt?: Date;
  createdDT?: string;
}

const CustomerTypeSchema = new Schema<ICustomerType>(
  {
    groupCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    discounts: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr: number[]) =>
          Array.isArray(arr) &&
          arr.every((val) => typeof val === "number" && val >= 0 && val <= 100),
        message: "Each discount must be a number between 0 and 100",
      },
      set: (arr: number[]) =>
        arr
          .map((val) => {
            const num = typeof val === "number" ? val : parseFloat(String(val));
            return isNaN(num) ? null : Math.round(num * 100) / 100;
          })
          .filter((val) => val !== null),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// ✅ Virtual field for MMDDYYYY format
CustomerTypeSchema.virtual("createdDT").get(function () {
  if (!this.createdAt) return null;
  const date = new Date(this.createdAt);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}${dd}${yyyy}`;
});

export const CustomerType =
  models.CustomerType ||
  model<ICustomerType>("CustomerType", CustomerTypeSchema);
