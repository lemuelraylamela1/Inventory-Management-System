import mongoose, { Schema, Document, model, models } from "mongoose";

export interface DeliveryDocument extends Document {
  drNo: string;
  soNumber: string;
  customer?: string;
  warehouse?: string;
  shippingAddress?: string;
  deliveryDate?: Date;
  remarks?: string;
  status: string;
  items?: {
    itemCode?: string;
    itemName: string;
    availableQuantity: number;
    quantity: number;
    selected: boolean;
    unitType: string;
    price: number;
    amount: number;
    weight?: number;
    cbm?: number;
  }[];
}

const DeliverySchema: Schema = new Schema(
  {
    drNo: { type: String, unique: true, required: true },
    soNumber: { type: String, required: true },
    customer: { type: String, required: true },
    warehouse: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    remarks: { type: String, default: "" },
    status: { type: String, default: "PREPARED" },
    items: [
      {
        itemCode: { type: String },
        itemName: { type: String, required: true },
        availableQuantity: { type: Number, required: true },
        quantity: { type: Number, required: true },
        selected: { type: Boolean, default: true },
        unitType: { type: String },
        price: { type: Number },
        amount: { type: Number },
        weight: { type: Number },
        cbm: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate DR number
DeliverySchema.pre("validate", async function (next) {
  if (!this.drNo) {
    const lastDR = await DeliveryModel.findOne(
      {},
      {},
      { sort: { createdAt: -1 } }
    );
    const lastNumber = lastDR?.drNo
      ? parseInt(lastDR.drNo.replace("DR", ""), 10)
      : 0;
    const newNumber = lastNumber + 1;
    this.drNo = `DR${newNumber.toString().padStart(10, "0")}`;
  }
  next();
});

const DeliveryModel =
  models.Delivery || model<DeliveryDocument>("Delivery", DeliverySchema);

export default DeliveryModel;
