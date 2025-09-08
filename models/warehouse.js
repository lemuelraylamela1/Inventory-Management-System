import mongoose, { Schema } from "mongoose";

const warehouseSchema = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    warehouse_code: String,
    warehouse_name: String,
    warehouse_location: String,
  },
  {
    timestamps: true,
  }
);

const Warehouse =
  mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;
