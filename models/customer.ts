import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ICustomer extends Document {
  customerCode: string;
  customerName: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress?: string;
  TIN: string;
  customerGroup: string; // now a plain string
  salesAgent: string; // now a plain string
  terms: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdDT?: string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      required: false, // or just omit this line entirely
    },
    contactPerson: {
      type: String,
      trim: true,
      uppercase: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    emailAddress: {
      type: String,
      trim: true,
    },

    TIN: {
      type: String,
      trim: true,
    },
    customerGroup: {
      type: String,
      trim: true,
      uppercase: true,
    },
    salesAgent: {
      type: String,
      trim: true,
      uppercase: true,
    },
    terms: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

// Virtual field for formatted createdAt
CustomerSchema.virtual("createdDT").get(function () {
  if (!this.createdAt) return null;
  const date = new Date(this.createdAt);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}${dd}${yyyy}`;
});

CustomerSchema.set("toJSON", { virtuals: true });
CustomerSchema.set("toObject", { virtuals: true });

export const Customer =
  models.Customer || model<ICustomer>("Customer", CustomerSchema);
