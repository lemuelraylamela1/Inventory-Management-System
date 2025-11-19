import mongoose, { Schema, Document, model, models } from "mongoose";

export interface DeliveryItem {
  itemCode?: string;
  itemName: string;
  quantity: number;
  selected: boolean;
  unitType?: string;
  price?: number;
  amount?: number;
  weight?: number;
  cbm?: number;
  availableQuantity?: number; // NEW: remaining quantity to be delivered
}

export interface DeliveryDocument extends Document {
  drNo: string;
  soNumber: string;
  customer: string;
  warehouse: string;
  shippingAddress: string;
  deliveryDate: Date;
  remarks?: string;
  status: string;
  items?: DeliveryItem[];
  total?: number;
}

const DeliverySchema = new Schema<DeliveryDocument>(
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
        quantity: { type: Number, required: true },
        selected: { type: Boolean, default: true },
        unitType: { type: String },
        price: { type: Number },
        amount: { type: Number },
        weight: { type: Number },
        cbm: { type: Number },
        availableQuantity: { type: Number, default: 0 }, // NEW
      },
    ],
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate total of selected items before saving
DeliverySchema.pre("save", function (next) {
  const doc = this as DeliveryDocument;
  if (doc.items?.length) {
    doc.total = doc.items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  next();
});

// Auto-generate DR number
DeliverySchema.pre("validate", async function (next) {
  const doc = this as DeliveryDocument;
  if (!doc.drNo) {
    const lastDR = await DeliveryModel.findOne(
      {},
      {},
      { sort: { createdAt: -1 } }
    );
    const lastNumber = lastDR?.drNo
      ? parseInt(lastDR.drNo.replace("DR", ""), 10)
      : 0;
    doc.drNo = `DR${(lastNumber + 1).toString().padStart(10, "0")}`;
  }
  next();
});

const DeliveryModel =
  models.Delivery || model<DeliveryDocument>("Delivery", DeliverySchema);

export default DeliveryModel;
