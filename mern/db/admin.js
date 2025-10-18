import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Admin } from "./users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ../config.env (one folder up from /db)
dotenv.config({ path: path.resolve(__dirname, "../config.env") });

console.log("ATLAS_URI from env:", process.env.ATLAS_URI); // 👈 debug line

const MONGO_URI = process.env.ATLAS_URI;

const createAdmin = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("❌ MONGO_URI is undefined. Check your config.env path.");
    }

    await mongoose.connect(MONGO_URI);

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      username: "admin",
      password: hashedPassword,
    });

    console.log("✅ Admin account created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
