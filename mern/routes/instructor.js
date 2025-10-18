// src/routes/instructors.js
import express from "express";
import { User } from "../db/users.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { Instructor } from "../db/users.js"; 
import CreatedLessons from "../db/CreatedLessons.js";  
import CreatedCourses from "../db/CreatedCourses.js";
import CreatedClassrooms from "../db/CreatedClassrooms.js";

const router = express.Router();

// Get lessons created by instructor
router.get("/:id/lessons", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ error: "Instructor not found" });

    const lessons = await CreatedLessons.find({ createdBy: instructor.username });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

// Get courses created by instructor
router.get("/:id/courses", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ error: "Instructor not found" });

    const courses = await CreatedCourses.find({ owner: instructor.username });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get classrooms created by instructor
router.get("/:id/classrooms", async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ error: "Instructor not found" });

    const classrooms = await CreatedClassrooms.find({ owner: instructor.username });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
});


// Function to check if instructor is active
function isInstructorActive(instructor) {
  if (!instructor.lastLogin) return false;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return instructor.lastLogin >= thirtyDaysAgo;
}

// GET /api/instructors - Get all instructors with activity status
router.get("/", async (req, res) => {
  try {
    const instructors = await Instructor.find()
      .sort({ createdAt: -1 });

    // Calculate activity status for each instructor
    const instructorsWithActivity = instructors.map((instructor) => {
      const instObj = instructor.toObject();
      return {
        ...instObj,
        isActive: isInstructorActive(instObj),
        lastActivity: instObj.lastLogin || "Never",
      };
    });

    res.status(200).json(instructorsWithActivity);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ error: "Failed to fetch instructors" });
  }
});

// DELETE /:id - Delete instructor
router.delete("/:id", async (req, res) => {
  try {
    const instructor = await User.findByIdAndDelete(req.params.id);

    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    // Archive lessons created by this instructor
    await CreatedLessons.updateMany(
      { createdBy: instructor.username },
      { $set: { status: "Archived" } } 
    );

    res.status(200).json({ message: "Instructor deleted successfully" });
  } catch (error) {
    console.error("Error deleting instructor:", error);
    res.status(500).json({ error: "Failed to delete instructor" });
  }
});

// GET /me - Get logged in instructor
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.user.id).exec();

    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    res.json({
      id: instructor._id,
      username: instructor.username,
      role: instructor.role,
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      status: instructor.status,
      lastLogin: instructor.lastLogin,
    });
  } catch (err) {
    console.error("Error in /instructors/me:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
