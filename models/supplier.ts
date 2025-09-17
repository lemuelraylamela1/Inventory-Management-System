import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    supplierName: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      uppercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      match: /^09\d{9}$/, // PH mobile format
    },
    emailAddress: {
      type: String,

      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    address: {
      type: String,

      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Composite uniqueness constraint
SupplierSchema.index(
  { supplierCode: 1, supplierName: 1 },
  { unique: true, name: "unique_supplier_code_name" }
);

export default mongoose.models.Supplier ||
  mongoose.model("Supplier", SupplierSchema);
