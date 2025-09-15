import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICustomerType extends Document {
  groupCode: string;
  groupName: string;
  discount1: number;
  discount2: number;
  discount3: number;
  discount4: number;
  discount5: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdDT?: string; // Virtual field for formatted date
}

const percentageValidator = {
  validator: (value: number) => value >= 0 && value <= 100,
  message: "Discount must be between 0 and 100",
};

const CustomerTypeSchema = new Schema<ICustomerType>(
  {
    groupCode: { type: String, required: true, trim: true },
    groupName: { type: String, required: true, trim: true },
    discount1: { type: Number, default: 0, validate: percentageValidator },
    discount2: { type: Number, default: 0, validate: percentageValidator },
    discount3: { type: Number, default: 0, validate: percentageValidator },
    discount4: { type: Number, default: 0, validate: percentageValidator },
    discount5: { type: Number, default: 0, validate: percentageValidator },
  },
  { timestamps: true }
);

// ✅ Virtual field for formatted createdAt
CustomerTypeSchema.virtual("createdDT").get(function () {
  return this.createdAt ? this.createdAt.toISOString() : null;
});

// ✅ Ensure virtuals are included in JSON and object outputs
CustomerTypeSchema.set("toJSON", { virtuals: true });
CustomerTypeSchema.set("toObject", { virtuals: true });

export const CustomerType =
  models.CustomerType ||
  model<ICustomerType>("CustomerType", CustomerTypeSchema);
