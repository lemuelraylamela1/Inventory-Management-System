import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string; // stored in plain text
  role: "ADMINISTRATOR" | "MANAGER" | "USER";
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMINISTRATOR", "MANAGER", "USER"],
      default: "USER",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
