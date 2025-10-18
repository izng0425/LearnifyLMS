import express from "express";
import cors from "cors";
import { connectDB } from "./db/connection.js";
import dotenv from "dotenv";
import records from "./routes/record.js";
import authRoutes from "./routes/auth.js";
import lessonsRoutes from "./routes/lessons.js";
import jwt from "jsonwebtoken";
import studentRoutes from "./routes/student.js";
import coursesRoutes from "./routes/courses.js";
import classroomRoutes from "./routes/classrooms.js";
import gradesRouter from "./routes/grades.js";
import instructorsRouter from "./routes/instructor.js";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: "./config.env" });

// Debug: check if ATLAS_URI loaded correctly
console.log("ATLAS_URI:", process.env.ATLAS_URI);
console.log("Loaded SECRET_KEY:", process.env.SECRET_KEY);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/record", records);
app.use("/auth", authRoutes);
app.use("/lessons", lessonsRoutes);
app.use("/api/students", studentRoutes);
app.use("/courses", coursesRoutes);
app.use("/classrooms", classroomRoutes);
app.use("/grades", gradesRouter);
app.use("/api/instructors", instructorsRouter);

// ---------- Serve Frontend (Vite build) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, "client/dist")));

// Handle all other routes by serving index.html (for React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist", "index.html"));
});
// --------------------------------------------------

// Connect to MongoDB and start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
