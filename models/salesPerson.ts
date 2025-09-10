import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISalesPerson extends Document {
  createdDT?: Date;
  salesPersonCode: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  contactNumber: string;
  address: string;
  TIN: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const salesPersonSchema: Schema<ISalesPerson> = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    salesPersonCode: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    emailAddress: { type: String },
    contactNumber: { type: String },
    address: { type: String },
    TIN: { type: String },
    status: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

salesPersonSchema.virtual("salesPersonName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

const SalesPerson: Model<ISalesPerson> =
  mongoose.models.SalesPerson ||
  mongoose.model<ISalesPerson>("SalesPerson", salesPersonSchema, "salesPerson");

export default SalesPerson;
