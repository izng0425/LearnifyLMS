import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

console.log("ATLAS_URI:", process.env.ATLAS_URI);

mongoose.connect(process.env.ATLAS_URI)
  .then(() => {
    console.log("✅ Connected successfully to MongoDB Atlas");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  });
