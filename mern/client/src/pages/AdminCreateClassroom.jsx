// src/pages/CreateClassroom.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminCreateClassroom() {
  const navigate = useNavigate();

  // --- Form state ---
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [courses, setCourse] = useState(""); // selected course _id (string)

  // Multiple selections
  const [lessonIds, setLessonIds] = useState([]);
  const [studentIds, setStudentIds] = useState([]);

  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");

  const [existingCourses, setExistingCourses] = useState([]);
  const [existingLessons, setExistingLessons] = useState([]);
  const [existingStudents, setExistingStudents] = useState([]);

  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState("Draft");

  // NEW: timestamps (read-only display, like CreateCourses)
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // ---- helpers ----
  function getUserFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email || payload.id || "";
    } catch (err) {
      console.error("❌ Failed to decode token", err);
      return "";
    }
  }

  useEffect(() => {
    setOwner(getUserFromToken());
  }, []);

  // Fetch available courses once
  useEffect(() => {
    async function fetchCourses() {
      try {
        const cRes = await fetch("http://localhost:5050/courses");
        if (cRes.ok) {
          const data = await cRes.json();
          setExistingCourses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    }
    fetchCourses();
  }, []);

  // When a course is chosen, fetch its lessons and students
  useEffect(() => {
    if (!courses) return;

    async function fetchCourseData() {
      try {
        const lRes = await fetch(`http://localhost:5050/courses/${courses}/lessons`);
        if (lRes.ok) {
          const lessons = await lRes.json();
          setExistingLessons(Array.isArray(lessons) ? lessons : []);
        } else {
          setExistingLessons([]);
        }

        const sRes = await fetch(`http://localhost:5050/courses/${courses}/students`);
        if (sRes.ok) {
          const students = await sRes.json();
          setExistingStudents(Array.isArray(students) ? students : []);
        } else {
          setExistingStudents([]);
        }
      } catch (err) {
        console.error("Error fetching course lessons/students", err);
        setExistingLessons([]);
        setExistingStudents([]);
      }
    }

    fetchCourseData();
  }, [courses]);

  // toggle one lesson
  const toggleLesson = (lid) => {
    setLessonIds((prev) => (prev.includes(lid) ? prev.filter((x) => x !== lid) : [...prev, lid]));
  };

  // toggle one student
  const toggleStudent = (sid) => {
    setStudentIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  };

  async function handleSave() {
    if (!title || !courses || lessonIds.length === 0 || !startTime || !duration) {
      setErrorMessage("⚠️ Please fill in all required fields before saving.");
      return;
    }
    setErrorMessage("");

    const token = sessionStorage.getItem("token");
    const newClassroom = {
      classroomId: id,
      title,
      owner,
      courses,                // course _id
      lessons: lessonIds,     // array of lesson _ids
      startTime,
      duration,
      students: studentIds,   // array of student _ids
      numStudents: studentIds.length,
      status,
    };

    try {
      const res = await fetch("http://localhost:5050/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClassroom),
      });

      const data = await res.json();

      if (res.ok) {
        // If backend returns timestamps, reflect them before navigating
        setCreatedAt(data?.createdAt || "");
        setUpdatedAt(data?.updatedAt || "");
        setShowMessage(true);
        setTimeout(() => {
          navigate("/instructor-classroom");
        }, 1000);
      } else {
        console.error("❌ Error:", data.error);
        alert(data.error || "Failed to save classroom");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Server error");
    }
  }

  function handleClear() {
    setId("");
    setTitle("");
    setCourse("");
    setLessonIds([]);
    setStartTime("");
    setExistingLessons([]);
    setExistingStudents([]);
    setDuration("");
    setStudentIds([]);
    setOwner(getUserFromToken());
    setErrorMessage("");
    setShowMessage(false);
    setCreatedAt("");
    setUpdatedAt("");
  }

  return (
    <div className="flex min-h-screen justify-center p-6">
      <main className="w-full max-w-4xl">
        {/* Header with title (left) and Back button (right) */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">Create Classroom</h1>
          <button
            type="button"
            onClick={() => navigate("/admin-classroom")}
            className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
          >
            ← Back
          </button>
        </div>

        <section className="mt-4 grid gap-4 rounded-xl border border-teal-200 bg-white p-6 shadow-sm">
          {errorMessage && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* ID */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Classroom ID</label>
            <input
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Classroom ID"
            />
          </div>

          {/* Title */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Title *</label>
            <input
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Classroom title"
            />
          </div>

          {/* Owner */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Owner</label>
            <div>{owner}</div>
          </div>

          {/* Status */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Course selector */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Course *</label>
            <select
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={courses}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option value="">Select a course</option>
              {existingCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lessons list */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Lessons *</label>
            <div className="rounded-md border border-teal-200 px-3 py-2 max-h-48 overflow-auto">
              {existingLessons.length > 0 ? (
                <ul className="space-y-2">
                  {existingLessons.map((l) => {
                    const idVal = String(l._id);
                    return (
                      <li key={idVal} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={lessonIds.includes(idVal)}
                          onChange={() => toggleLesson(idVal)}
                        />
                        <span>{`${l.lessonId} - ${l.title || "Untitled lesson"}`}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No lessons found for this course</p>
              )}
            </div>
          </div>

          {/* Students list */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Students</label>
            <div className="rounded-md border border-teal-200 px-3 py-2 max-h-48 overflow-auto">
              {existingStudents.length > 0 ? (
                <ul className="space-y-2">
                  {existingStudents.map((s) => {
                    const idVal = String(s._id);
                    return (
                      <li key={idVal} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={studentIds.includes(idVal)}
                          onChange={() => toggleStudent(idVal)}
                        />
                        <span>
                          {s.firstName} {s.lastName} ({s.username})
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No students enrolled in this course</p>
              )}
            </div>
          </div>

          {/* When class starts */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Class start date/time *</label>
            <input
              type="datetime-local"
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Duration of class (minutes) *</label>
            <input
              type="number"
              min="0"
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 90"
            />
          </div>

          {/* Number of students */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Number of students</label>
            <div>{studentIds.length}</div>
          </div>

          {/* Created & Last Updated (read-only) */}
          <div className="grid gap-1 text-sm text-slate-500 mt-2">
            <p>
              Created:{" "}
              {createdAt
                ? new Date(createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </p>
            <p>
              Last updated:{" "}
              {updatedAt
                ? new Date(updatedAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              Clear
            </button>
          </div>
        </section>

        {showMessage && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">
              Classroom created successfully!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
