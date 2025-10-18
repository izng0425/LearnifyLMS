import express from "express";
import CreatedCourses from "../db/CreatedCourses.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { Student } from "../db/users.js";
import CreatedClassrooms from "../db/CreatedClassrooms.js";
import CreatedLessons from "../db/CreatedLessons.js";

const router = express.Router();

// ✅ Create a course
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { courseId, title, description, lessons, status,totalCredit, owner } = req.body;

    // Check if a course with the same courseId already exists
    const existingCourse = await CreatedCourses.findOne({ courseId: courseId });
    if (existingCourse) {
      return res.status(409).json({ error: "A course with this ID already exists." });
    }

    const createdBy = req.user.email;
    const course = await CreatedCourses.create({
      courseId,
      title,
      description,
      lessons,
      status: status || "Draft",
      totalCredit,
      owner: createdBy,
    });

    // 2. Update all lessons with the new course ID
    if (lessons && lessons.length > 0) {
      await CreatedLessons.updateMany(
        { _id: { $in: lessons } },
        { $set: { course: course._id } }
      );
    }

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✅ Get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await CreatedCourses.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /courses/published - only for student view
router.get("/published", async (req, res) => {
  try {
    const courses = await CreatedCourses.find({ status: "Published" }).sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching published courses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});


// ✅ Get only published lessons of a course
router.get("/:id/published-lessons", async (req, res) => {
  try {
    console.log("PUBLISHED LESSONS endpoint called with ID:", req.params.id);

    const course = await CreatedCourses.findById(req.params.id)
      .populate({
        path: "lessons",
        match: { status: "Published" }, // ✅ only published lessons
        populate: { path: "createdBy", select: "firstName lastName username email" }
      });

    if (!course) return res.status(404).json({ error: "Course not found" });

    res.json(course.lessons);
  } catch (err) {
    console.error("Error fetching published lessons:", err);
    res.status(500).json({ error: err.message });
  }
});




// ✅ Get lessons of a course
router.get("/:id/lessons", async (req, res) => {
  try {
    console.log("LESSONS endpoint called with ID:", req.params.id);

    const course = await CreatedCourses.findById(req.params.id)
      .populate({
        path: "lessons",
        populate: { path: "createdBy", select: "firstName lastName username email" }
      });
        console.log("Found course:", course);
    
    if (!course) return res.status(404).json({ error: "Course not found" });

    console.log("Course lessons:", course.lessons);

    res.json(course.lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ New route: fetch only students with no classroom for a course
router.get("/:id/students/unassigned", async (req, res) => {
  try {
    const { id } = req.params;

    // Make sure the course exists (optional check)
    const course = await CreatedCourses.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Fetch only students in this course with classroom === null
    const students = await Student.find({
      course: id,
      classroom: null,
    });

    res.status(200).json(students);
  } catch (err) {
    console.error("Error fetching unassigned students:", err);
    res.status(500).json({ error: "Failed to fetch unassigned students" });
  }
});

// ✅ Get students of a course
router.get("/:id/students", async (req, res) => {
  try {
    const course = await CreatedCourses.findById(req.params.id)
      .populate("students", "firstName lastName username");
    if (!course) return res.status(404).json({ error: "Course not found" });

    res.json(course.students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Get one course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await CreatedCourses.findById(req.params.id)
      .populate("lessons");
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ Update a course
router.put("/:id", async (req, res) => {
  try {
    const {lessons} = req.body;

    const updated = await CreatedCourses.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Course not found" });

    if (lessons) {
      // 1. Clear old links
      await CreatedLessons.updateMany(
        { course: updated._id },
        { $set: { course: null } }
      );

      // 2. Set new links
      await CreatedLessons.updateMany(
        { _id: { $in: lessons } },
        { $set: { course: updated._id } }
      );
    }



    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete a course
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CreatedCourses.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/enrol", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (student.course) return res.status(400).json({ error: "Already enrolled" });

    const course = await CreatedCourses.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    student.course = course._id;   // Save course reference
    await student.save();           // Persist it in DB

    if (!course.students.includes(student._id)) {
      course.students.push(student._id);
      await course.save();
    }

    res.json({ message: "Enrolled successfully", course: course._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /courses/:id/unenrol
router.post("/:id/unenrol", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (!student.course || student.course.toString() !== req.params.id) {
      return res.status(400).json({ error: "You are not enrolled in this course" });
    }

    // Get the course
    const course = await CreatedCourses.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Remove course reference from student from student
    student.course = null;
    await student.save();

    // Remove student from course.students
    course.students = course.students.filter(
      (s) => s.toString() !== student._id.toString()
    );
    await course.save();

    const classrooms = await CreatedClassrooms.find({ courses: course._id });

    for (const classroom of classrooms) {
      const beforeCount = classroom.students.length;

      classroom.students = classroom.students.filter(
        (s) => s.toString() !== student._id.toString()
      );
      classroom.numStudents = classroom.students.length;

      // If the student’s classroom matches this one, clear it
      if (student.classroom && student.classroom.toString() === classroom._id.toString()) {
        student.classroom = null;
      }

      // Save only if student was actually removed
      if (beforeCount !== classroom.students.length) {
        await classroom.save();
      }
    }

    // Save student at the end
    await student.save();

    res.json({ message: "Unenrolled successfully" });
  } catch (err) {
    console.error("Error in unenrol:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



export default router;