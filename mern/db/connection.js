import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.ATLAS_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI); // ✅ simplified — no deprecated options
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

export { mongoose, connectDB };
