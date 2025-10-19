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

// ---------- Serve Frontend (React build inside client/dist) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, "client/dist")));

// Serve index.html for any other routes (for React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist", "index.html"));
});
// --------------------------------------------------

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
