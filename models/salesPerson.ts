import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISalesPerson extends Document {
  createdDT?: Date;
  salesperson_code: string;
  salesperson_name: string;
  salesperson_email: string;
  salesperson_status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const salesPersonSchema: Schema<ISalesPerson> = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    salesperson_code: { type: String, required: true },
    salesperson_name: { type: String, required: true },
    salesperson_email: { type: String, required: true },
    salesperson_status: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const SalesPerson: Model<ISalesPerson> =
  mongoose.models.SalesPerson ||
  mongoose.model<ISalesPerson>("SalesPerson", salesPersonSchema);

export default SalesPerson;
