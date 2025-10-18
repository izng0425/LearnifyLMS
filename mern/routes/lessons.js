import express from "express";
import CreatedLessons from "../db/CreatedLessons.js";  
import authMiddleware from "../middleware/authMiddleware.js";
import CreatedClassrooms from "../db/CreatedClassrooms.js";

const router = express.Router();

// ✅ Create a lesson (draft or published)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { lessonId, title, description, objective, prerequisites, status, creditPoints, readings, assignments, estimatedWork } = req.body;
    
    const createdBy = req.user.email;
    
    const lesson = await CreatedLessons.create({
      lessonId,
      title,
      description,
      objective,    
      prerequisites,
      createdBy,
      status,
      creditPoints,
      readings,
      assignments,
      estimatedWork
    });
    
    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get all lessons
router.get("/", async (req, res) => {
  try {
    const lessons = await CreatedLessons.find();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get one lesson by ID
router.get("/:id", async (req, res) => {
  try {
    const lesson = await CreatedLessons.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update a lesson (can also change draft → published)
router.put("/:id", async (req, res) => {
  try {
    const updated = await CreatedLessons.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Lesson not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete a lesson
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CreatedLessons.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Lesson not found" });
    res.json({ message: "Lesson deleted sucessfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Get only draft lessons
router.get("/status/draft", async (req, res) => {
  try {
    const drafts = await CreatedLessons.find({ status: "draft" });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get only published lessons
router.get("/status/published", async (req, res) => {
  try {
    const published = await CreatedLessons.find({ status: "published" });
    res.json(published);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// routes/lessons.js
router.get("/classroom/:classroomId", async (req, res) => {
  try {
    const classroom = await CreatedClassrooms.findById(req.params.classroomId).populate("lessons");
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json(classroom.lessons); // return lessons linked in classroom
  } catch (err) {
    console.error("Error fetching lessons by classroom:", err);
    res.status(500).json({ message: err.message });
  }
});




export default router;
