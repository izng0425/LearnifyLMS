import express from "express";
import { User } from "../db/users.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { Student } from "../db/users.js";

const router = express.Router();

// Function to check if student is active
function isStudentActive(student) {
  if (!student.lastLogin) return false;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return student.lastLogin >= thirtyDaysAgo;
}

// GET /api/students - Get all students with activity status
router.get("/", async (req, res) => {
  try {
    // ✅ Use Student model so discriminator schema (with course ref) applies
    const students = await Student.find()
      .populate("course", "courseId title") // populate courseId + title
      .sort({ createdAt: -1 });

    // Calculate activity status for each student
    const studentsWithActivity = students.map(student => {
      const studentObj = student.toObject();
      return {
        ...studentObj,
        isActive: isStudentActive(studentObj),
        lastActivity: studentObj.lastLogin || "Never",
      };
    });

    res.status(200).json(studentsWithActivity);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// DELETE /:id - Delete student
router.delete("/:id", async (req, res) => {
  try {
    // ✅ Delete from User model (all user types are in same collection)
    const student = await User.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .populate("course") // now matches model name
      .exec();

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      id: student._id,
      username: student.username,
      role: student.role,
      firstName: student.firstName,
      lastName: student.lastName,
      course: student.course || null,
      status: student.status,
      lastLogin: student.lastLogin,
    });
  } catch (err) {
    console.error("Error in /students/me:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});






export default router;