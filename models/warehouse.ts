// import mongoose, { Schema } from "mongoose";

// const warehouseSchema = new Schema(
//   {
//     createdDT: { type: Date, default: Date.now },
//     warehouse_code: String,
//     warehouse_name: String,
//     warehouse_location: String,
//   },
//   {
//     timestamps: true,
//   }
// );

// const Warehouse =
//   mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);

// export default Warehouse;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWarehouse extends Document {
  createdDT?: Date;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_location: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const warehouseSchema: Schema<IWarehouse> = new Schema(
  {
    createdDT: { type: Date, default: Date.now },
    warehouse_code: { type: String, required: true },
    warehouse_name: { type: String, required: true },
    warehouse_location: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Warehouse: Model<IWarehouse> =
  mongoose.models.Warehouse ||
  mongoose.model < IWarehouse > ("Warehouse", warehouseSchema);

export default Warehouse;
