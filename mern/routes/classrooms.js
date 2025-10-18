import express from "express";
import CreatedClassrooms from "../db/CreatedClassrooms.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { Student } from "../db/users.js";

const router = express.Router();

// ✅ Create a course
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { classroomId, title, courses, lessons, students, startTime, duration, numStudents, owner, status } = req.body;

    // Check if a course with the same courseId already exists
    const existingClassroom= await CreatedClassrooms.findOne({ classroomId: classroomId });
    if (existingClassroom) {
      return res.status(409).json({ error: "A classroom with this ID already exists." });
    }

    const createdBy = req.user.email;
    const course = await CreatedClassrooms.create({
      classroomId, 
      title, 
      courses, 
      lessons,
      students: students || [], 
      startTime, 
      duration, 
      numStudents,
      owner: createdBy,
      status: status || "Draft", // default to Draft on creation
    });

    await course.save();

    if (students && students.length > 0) {
      await Student.updateMany(
        { _id: { $in: students } },
        { $set: { classroom: course._id } }
      );
    }
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all classrooms
router.get("/", async (req, res) => {
  try {
    const classrooms = await CreatedClassrooms.find()
      .populate("courses", "title")
      .populate("lessons", "title")
      .populate("students", "firstName username");
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get classrooms created by the logged-in instructor (with student count)
router.get("/my-created", authMiddleware, async (req, res) => {
  try {
    const instructorEmail = req.user.email;
    console.log("Fetching classrooms for instructor:", instructorEmail);

    // Fetch classrooms owned by this instructor
    const classrooms = await CreatedClassrooms.find({ owner: instructorEmail })
      .populate("courses", "title")
      .populate("lessons", "title")
      .populate("students", "firstName username");

    // ✅ Compute studentCount for each classroom
    const withCounts = classrooms.map((c) => ({
      ...c.toObject(),
      studentCount: c.students ? c.students.length : 0,
    }));

    res.json(withCounts);
  } catch (err) {
    console.error("Error in /my-created:", err);
    res.status(500).json({ error: "Failed to fetch instructor classrooms" });
  }
});



router.get("/my-lessons", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ username: req.user.email });
    if (!student) return res.status(404).json({ error: "Student not found" });
    if (!student.classroom) return res.json([]); // no classroom enrolled

    const classroom = await CreatedClassrooms.findById(student.classroom)
      .populate({
        path: "lessons",
        match: { status: "Published" }, 
      });

    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    res.json(classroom.lessons);
  } catch (err) {
    console.error("Error in /my-lessons:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});


router.get("/my-classrooms", authMiddleware, async (req, res) => {
  try {
    console.log("Decoded user from token:", req.user);

    // find student by email (from token)
    const student = await Student.findOne({ username: req.user.email }).populate("course");
    console.log("Student found:", student);

    if (!student) return res.status(404).json({ error: "Student not found" });
    if (!student.course) return res.json([]); // no course enrolled

    // get all classrooms linked to that course
    const classrooms = await CreatedClassrooms.find({ 
      courses: student.course._id,
    status: "Published", })
      .populate("courses", "title")
      .populate("lessons", "title")
      .populate("students", "firstName username");

    res.json(classrooms);
  } catch (err) {
    console.error("Error in /my-classrooms:", err);

    res.status(500).json({ error: err.message });
  }
});

// ✅ Get ongoing classrooms (duration in weeks)
router.get("/ongoing", authMiddleware , async (req, res) => {
  try {
    const now = new Date();
    console.log("🕒 Current time:", now);

    // Fetch published classrooms
    const classrooms = await CreatedClassrooms.find({ status: "Published" });
    console.log(`📚 Found ${classrooms.length} published classrooms.`);

    const ongoing = classrooms.filter((c) => {
      if (!c.startTime || !c.duration) {
        console.log(`⚠️ Skipping ${c.title || c._id}: missing startTime or duration.`);
        return false;
      }

      const start = new Date(c.startTime);
      const end = new Date(start.getTime() + c.duration * 7 * 24 * 60 * 60 * 1000); // duration in weeks

      const isOngoing = now >= start && now <= end;
      console.log(`📘 Classroom: ${c.title}`);
      console.log(`   ➤ Start: ${start}`);
      console.log(`   ➤ End:   ${end}`);
      console.log(`   ➤ Status: ${isOngoing ? "ONGOING ✅" : "Not ongoing ❌"}`);

      return isOngoing;
    });

    console.log(`✅ Total ongoing classrooms: ${ongoing.length}`);
    res.json(ongoing);
  } catch (err) {
    console.error("🔥 Error fetching ongoing classrooms:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Get completed classrooms (duration in weeks)
router.get("/completed", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    console.log("🕒 Current time:", now);

    // Fetch published classrooms
    const classrooms = await CreatedClassrooms.find({ status: "Published" });
    console.log(`📚 Found ${classrooms.length} published classrooms.`);

    const completed = classrooms.filter((c) => {
      if (!c.startTime || !c.duration) {
        console.log(`⚠️ Skipping ${c.title || c._id}: missing startTime or duration.`);
        return false;
      }

      const start = new Date(c.startTime);
      const end = new Date(start.getTime() + c.duration * 7 * 24 * 60 * 60 * 1000); // duration in weeks

      const isCompleted = now > end;
      console.log(`📕 Classroom: ${c.title}`);
      console.log(`   ➤ Start: ${start}`);
      console.log(`   ➤ End:   ${end}`);
      console.log(`   ➤ Status: ${isCompleted ? "COMPLETED ✅" : "Not completed ❌"}`);

      return isCompleted;
    });

    console.log(`✅ Total completed classrooms: ${completed.length}`);
    res.json(completed);
  } catch (err) {
    console.error("🔥 Error fetching completed classrooms:", err);
    res.status(500).json({ error: err.message });
  }
});


// In your classrooms.js router
router.get("/my-enrolled", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({ username: req.user.email });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Get classrooms where this student is enrolled
    const enrolledClassrooms = await CreatedClassrooms.find({
      students: student._id,
      status: "Published"
    });

    res.json(enrolledClassrooms.map(c => c._id)); // Return just the IDs
  } catch (err) {
    console.error("Error fetching enrolled classrooms:", err);
    res.status(500).json({ error: err.message });
  }
});



// GET /classrooms/published - only for student view
router.get("/published", authMiddleware, async (req, res) => {
  try {
    const classrooms = await CreatedClassrooms.find({ status: "Published" });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch classrooms", error: err.message });
  }
});

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const result = await CreatedClassrooms.aggregate([
      // 1️⃣ Join with the "courses" collection
      {
        $lookup: {
          from: "courses",            // name of your Course collection
          localField: "courses",      // field in classrooms
          foreignField: "_id",        // field in courses
          as: "courseDetails",        // output array of course docs
        },
      },

      // 2️⃣ Compute total credits for each classroom
      {
        $addFields: {
          totalCredits: {
            $sum: {
              $map: {
                input: { $ifNull: ["$courseDetails", []] },
                as: "course",
                in: { $ifNull: ["$$course.totalCredit", 0] }, // handle missing credits
              },
            },
          },
        },
      },

      // 3️⃣ Project only the needed fields
      {
        $project: {
          numStudents: 1,
          duration: 1,
          totalCredits: 1,
        },
      },

      // 4️⃣ Group to compute averages across all classrooms
      {
        $group: {
          _id: null,
          averageStudents: { $avg: "$numStudents" },
          averageCredits: { $avg: "$totalCredits" },
          averageDuration: { $avg: "$duration" },
        },
      },
    ]);

    if (!result.length) {
      return res.json({
        averageStudents: 0,
        averageCredits: 0,
        averageDuration: 0,
      });
    }

    const { averageStudents, averageCredits, averageDuration } = result[0];
    res.json({
      averageStudents: averageStudents?.toFixed(2) || 0,
      averageCredits: averageCredits?.toFixed(2) || 0,
      averageDuration: averageDuration?.toFixed(2) || 0,
    });
  } catch (err) {
    console.error("🔥 Error in /classrooms/stats:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get classrooms enrolled by student
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const classrooms = await CreatedClassrooms.find({ students: req.user.email });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch my classrooms", error: err.message });
  }
});


// ✅ Get classroom by DB ID
router.get("/:id", async (req, res) => {
  try {
    const classroom = await CreatedClassrooms.findById(req.params.id)
      .populate("courses", "title")
      .populate("lessons", "title")
      .populate("students", "firstName lastName username");
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ Update classroom
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await CreatedClassrooms.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Classroom not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete classroom
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await CreatedClassrooms.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Classroom not found" });
    
    await Student.updateMany(
      { _id: { $in: deleted.students } },
      { $set: { classroom: null } }
    );
    
    
    res.json({ message: "Classroom deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add a student to a classroom
router.post("/:id/students", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.body; // studentId comes from frontend

    const classroom = await CreatedClassrooms.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    // prevent duplicates
    if (classroom.students.includes(studentId)) {
      return res.status(400).json({ error: "Student already enrolled" });
    }

    classroom.students.push(studentId);
    classroom.numStudents = classroom.students.length; // auto update count

    await classroom.save();

    res.status(200).json({ message: "Student added successfully", classroom });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Remove a student from a classroom
router.delete("/:id/students/:studentId", authMiddleware, async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const classroom = await CreatedClassrooms.findById(id);
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    classroom.students = classroom.students.filter(
      (s) => s.toString() !== studentId
    );
    classroom.numStudents = classroom.students.length; // auto update count

    await classroom.save();

    await Student.findByIdAndUpdate(studentId, { $set: { classroom: null } });

    res.status(200).json({ message: "Student removed successfully", classroom });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get students of a classroom
router.get("/:id/students", async (req, res) => {
  try {
    const classroom = await CreatedClassrooms.findById(req.params.id)
      .populate("students", "firstName username");
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    res.json(classroom.students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// POST /classrooms/:id/enrol
router.post("/:id/enrol", authMiddleware, async (req, res) => {
  try {
    const classroomId = req.params.id;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const classroom = await CreatedClassrooms.findById(classroomId);
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    // Check if already enrolled in ANY classroom (not just this one)
    if (student.classroom) {
      // If already enrolled in a different classroom
      if (student.classroom.toString() !== classroomId) {
        // Find the classroom they're currently enrolled in
        const currentClassroom = await CreatedClassrooms.findById(student.classroom);
        const currentClassroomName = currentClassroom ? currentClassroom.title : "another classroom";
        
        return res.status(400).json({ 
          error: `You are already enrolled in ${currentClassroomName}. Please leave it first before joining a new classroom.` 
        });
      }
      // If already enrolled in this specific classroom
      return res.status(400).json({ error: "Already enrolled in this classroom" });
    }

    // Update student - enroll them
    student.classroom = classroomId;
    await student.save();

    // Update classroom - add student
    if (!classroom.students.includes(student._id)) {
      classroom.students.push(student._id);
      classroom.numStudents = classroom.students.length;
      await classroom.save();
    }

    res.json({ message: "Enrolled successfully", classroom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /classrooms/:id/unenrol
router.post("/:id/unenrol", authMiddleware, async (req, res) => {
  try {
    const classroomId = req.params.id;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const classroom = await CreatedClassrooms.findById(classroomId);
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });

    // Check if not enrolled
    if (!student.classroom || student.classroom.toString() !== classroomId) {
      return res.status(400).json({ error: "You are not enrolled in this classroom" });
    }

    // Remove classroom from student
    student.classroom = null;
    await student.save();

    // Remove student from classroom
    classroom.students = classroom.students.filter(
      (s) => s.toString() !== student._id.toString()
    );
    classroom.numStudents = classroom.students.length;
    await classroom.save();

    res.json({ message: "Unenrolled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;



