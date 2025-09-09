import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISalesPerson extends Document {
  createdDT?: Date;
  salesPersonCode: string;
  salesPersonName: string;
  emailAddress: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const salesPersonSchema: Schema<ISalesPerson> = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    salesPersonCode: { type: String, required: true },
    salesPersonName: { type: String, required: true },
    emailAddress: { type: String, required: true },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const SalesPerson: Model<ISalesPerson> =
  mongoose.models.SalesPerson ||
  mongoose.model<ISalesPerson>("SalesPerson", salesPersonSchema, "salesPerson");

export default SalesPerson;
