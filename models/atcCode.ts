// models/AtcCode.ts
import mongoose, { Schema, Document } from "mongoose";

export interface AtcCodeDocument extends Document {
  atcCode: string;
  taxRate: number;
  taxCode: string;
  description?: string;
  ewt?: number;
  cwt?: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const AtcCodeSchema: Schema<AtcCodeDocument> = new Schema(
  {
    atcCode: { type: String, required: true, unique: true, trim: true },
    taxRate: { type: Number, required: true, min: 0 },
    taxCode: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    ewt: { type: Number, default: 0 },
    cwt: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    versionKey: false,
  }
);

export default mongoose.models.AtcCode ||
  mongoose.model<AtcCodeDocument>("AtcCode", AtcCodeSchema);
