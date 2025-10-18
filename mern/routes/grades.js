import express from 'express';
import Grade from '../db/Grade.js';
import CreatedLesson from '../db/CreatedLessons.js';
import { User } from "../db/users.js";  // ✅ import base User
import authMiddleware from '../middleware/authMiddleware.js';





const router = express.Router();

// GRADE a lesson
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { student, lesson, classroom,score, feedback} = req.body;

    // Verify student exists and is a Student
    const studentDoc = await User.findById(student);
    if (!studentDoc || studentDoc.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }


    // Verify student is enrolled in the correct course/classroom
    if (!studentDoc.course || !studentDoc.classroom) {
      return res.status(400).json({ message: 'Student not enrolled in any course' });
    }

    // Create or update grade - NO gradedAt (using timestamps instead)
    const grade = await Grade.findOneAndUpdate(
      { student: student, lesson: lesson, classroom },
      { 
        score, 
        feedback, 
        classroom
        // ✅ REMOVED gradedAt - using createdAt from timestamps
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET student progress for their enrolled course - FIXED
router.get('/progress/:studentId', authMiddleware, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.course || !student.classroom) {
      return res.json({
        student: `${student.firstName} ${student.lastName}`,
        progress: 0,
        message: 'Student not enrolled in any course'
      });
    }

    const allLessonsInCourse = await CreatedLesson.find({
        // 🚀 FIX: Filter by the student's assigned COURSE ID, 
        // which exists on the Lesson model (implied)
        course: student.course 
    });


    // Get grades for ALL lessons in the course
    const grades = await Grade.find({
      student: student._id,
      lesson: { $in: allLessonsInCourse.map(l => l._id) },
      classroom: student.classroom
    }).populate('lesson');

    
    // Calculate progress based on ALL course lessons
    const passedLessons = grades.filter(grade => grade.passed).length;
    const totalLessonsInCourse = allLessonsInCourse.length;
    const progressPercentage = totalLessonsInCourse > 0 ? 
      (passedLessons / totalLessonsInCourse) * 100 : 0;

    // FIXED: Consistent response format for both graded and ungraded lessons
    const allGradesWithDefaults = allLessonsInCourse.map(lesson => {
      const existingGrade = grades.find(grade => 
        grade.lesson._id.toString() === lesson._id.toString()
      );
      
      if (existingGrade) {
        return {
          lessonId: existingGrade.lesson._id,        // ← Always include lessonId
          lessonTitle: existingGrade.lesson.title,   // ← Always include lessonTitle
          score: existingGrade.score,
          passed: existingGrade.passed,
          feedback: existingGrade.feedback,
          createdAt: existingGrade.createdAt,        // ← From timestamps
          status: 'graded'
        };
      } else {
        return {
          lessonId: lesson._id,                      // ← Same structure for ungraded
          lessonTitle: lesson.title,                 // ← Same structure for ungraded
          score: '-',
          passed: false,
          feedback: 'Not graded yet',
          createdAt: null,
          status: 'ungraded'
        };
      }
    });

    res.json({
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        course: student.course,
        classroom: student.classroom
      },
      progress: progressPercentage,
      passedLessons,
      totalLessonsInCourse,
      grades: allGradesWithDefaults,  // ← Now consistent format
      summary: {
        graded: grades.length,
        ungraded: totalLessonsInCourse - grades.length,
        total: totalLessonsInCourse
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET grades for a specific classroom (instructor view) - FIXED for frontend
router.get('/classroom/:classroomId', authMiddleware, async (req, res) => {
  try {
    // Get all lessons in this classroom
    const lessons = await CreatedLesson.find({ 
      classroom: req.params.classroomId 
    });
        console.log("Lessons found for classroom:", lessons.map(l => l._id));

    
    const grades = await Grade.find({ 
      lesson: { $in: lessons.map(l => l._id) }
    })
      .populate('student', 'firstName lastName username')
      .populate('lesson', 'title course classroom')
    console.log("Grades found:", grades);
    // FIXED: Return proper structure for frontend
    const formattedGrades = grades.map(grade => ({
      _id: grade._id,
      score: grade.score,
      passed: grade.passed,
      feedback: grade.feedback,
      createdAt: grade.createdAt,  // ← From timestamps
      student: grade.student,
      lesson: grade.lesson._id,    // ← Include lesson ID for mapping
      lessonDetails: grade.lesson // ← Include full lesson details
    }));
    
    res.json(formattedGrades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all grades for a specific lesson (instructor view)
router.get('/lesson/:lessonId', authMiddleware, async (req, res) => {
  try {
    const grades = await Grade.find({ lesson: req.params.lessonId })
      .populate('student', 'firstName lastName username')
    
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all grades for a specific student
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId })
      .populate('lesson', 'title course classroom')
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single grade by ID
router.get('/:gradeId', authMiddleware, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.gradeId)
      .populate('student', 'firstName lastName username')
      .populate('lesson', 'title course classroom')
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE a grade
router.put('/:gradeId', authMiddleware, async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(
      req.params.gradeId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName')
      .populate('lesson', 'title')
    
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    
    res.json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a grade
router.delete('/:gradeId', authMiddleware, async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.gradeId);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET course statistics for instructor
router.get('/course/:courseId/stats', authMiddleware, async (req, res) => {
  try {
    const lessons = await CreatedLesson.find({ course: req.params.courseId });
    const grades = await Grade.find({ 
      lesson: { $in: lessons.map(l => l._id) }
    }).populate('student lesson');

    // Calculate statistics
    const totalStudents = [...new Set(grades.map(g => g.student._id.toString()))].length;
    const totalLessons = lessons.length;
    const averageScores = lessons.map(lesson => {
      const lessonGrades = grades.filter(g => g.lesson._id.toString() === lesson._id.toString());
      const avgScore = lessonGrades.length > 0 
        ? lessonGrades.reduce((sum, g) => sum + g.score, 0) / lessonGrades.length 
        : 0;
      return {
        lesson: lesson.title,
        averageScore: Math.round(avgScore * 100) / 100,
        totalGraded: lessonGrades.length,
        passRate: lessonGrades.length > 0 
          ? (lessonGrades.filter(g => g.passed).length / lessonGrades.length) * 100 
          : 0
      };
    });

    res.json({
      course: req.params.courseId,
      totalStudents,
      totalLessons,
      totalGrades: grades.length,
      averageScores,
      overallPassRate: grades.length > 0 
        ? (grades.filter(g => g.passed).length / grades.length) * 100 
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /classrooms/:classroomId/grades
router.get("/:classroomId/grades", async (req, res) => {
  const { classroomId } = req.params;
  try {
    const grades = await Grade.find({ classroom: classroomId })
      .populate("student")
      .populate("lesson");

    console.log("✅ Grades found:", grades);
    res.status(200).json(grades);
  } catch (err) {
    console.error("❌ Error fetching grades:", err);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});


export default router;