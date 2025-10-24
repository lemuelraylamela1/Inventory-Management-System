import mongoose, { Schema, Document, Model } from "mongoose";

export interface TransferRequestItem {
  itemCode: string;
  quantity: number;
  unitType: string;
}

export interface TransferRequest extends Document {
  date: Date;
  requestNo: string;
  requestingWarehouse: string;
  sourceWarehouse: string;
  transactionDate: Date;
  transferDate?: Date;
  reference?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  preparedBy: string;
  items: TransferRequestItem[];
}

const TransferRequestItemSchema = new Schema<TransferRequestItem>(
  {
    itemCode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitType: { type: String, required: true },
  },
  { _id: false }
);

const TransferRequestSchema = new Schema<TransferRequest>(
  {
    requestNo: { type: String, unique: true },
    requestingWarehouse: { type: String },
    sourceWarehouse: { type: String },
    transactionDate: { type: Date },
    transferDate: { type: Date },
    reference: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    preparedBy: { type: String, required: true },
    items: { type: [TransferRequestItemSchema], required: true },
  },
  { timestamps: true }
);

// 🔢 Static method to generate next request number
TransferRequestSchema.statics.generateNextRequestNo =
  async function (): Promise<string> {
    const latest = await this.findOne()
      .sort({ createdAt: -1 })
      .select("requestNo");
    const prefix = "ST";
    const padLength = 10;

    if (!latest || !latest.requestNo) {
      return `${prefix}${"1".padStart(padLength, "0")}`;
    }

    const currentNum = parseInt(latest.requestNo.slice(2), 10);
    const nextNum = currentNum + 1;
    return `${prefix}${nextNum.toString().padStart(padLength, "0")}`;
  };

export const TransferRequestModel: Model<TransferRequest> =
  mongoose.models.TransferRequest ||
  mongoose.model<TransferRequest>("TransferRequest", TransferRequestSchema);
