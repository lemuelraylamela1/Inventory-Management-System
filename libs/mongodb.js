import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB is already connected.");
  } catch (error) {
    console.error("Error checking MongoDB connection state:", error);
  }
};

export default connectMongoDB;
console.log("MongoDB connected successfully.");
