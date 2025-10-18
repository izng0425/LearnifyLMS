// src/pages/CreateCourses.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function InstructorCreateCourses() {
  const navigate = useNavigate();

  // ----- Form state -----
  const [courseId, setCourseId] = useState("");                 // e.g., C2001
  const [title, setTitle] = useState("");                       // course title for list cards
  const [description, setDescription] = useState("");           // course description
  const [lessonIds, setLessonIds] = useState([]);               // selected lesson _ids (checkboxes)
  const [owner, setOwner] = useState("");  // default owner

  // Lessons options from API
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Visual-only toast
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdAt] = useState("");
  const [updatedAt] = useState("");
  const [status, setStatus] = useState("Draft");

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
  
  // Calculate total credit based on selected lessons
    const totalCredit = useMemo(() => {
    const total = lessonIds.reduce((total, lessonId) => {
      const lesson = lessons.find(l => String(l._id) === lessonId);
      const creditValue = lesson?.creditPoints;
      console.log(`Lesson ${lessonId} credit value:`, creditValue);
      return total + (creditValue || 0);
    }, 0);
    console.log("Total credit calculated:", total);
    return total;
  }, [lessonIds, lessons]);  

  // Fetch lessons (for checklist)
  useEffect(() => {
    const fetchLessons = async () => {
      setLoadingLessons(true);
      const token = sessionStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5050/lessons", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch lessons");
        const data = await res.json();
        setLessons(Array.isArray(data) ? data.filter(l => l.status === "Published") : []);
      } catch {
        setLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    };
    fetchLessons();
  }, []);

  // ----- Handlers -----
  const toggleLesson = (id) =>
    setLessonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAll = () => setLessonIds(lessons.map((l) => String(l._id)));
  const clearAll = () => setLessonIds([]);

  async function handleSave() {
    // ⚠️ Check required fields for a course
    if (!courseId || !title || !description) {
      setErrorMessage("⚠️ Please fill in all required fields.");
      return;
    }
    setErrorMessage(""); // clear old error if any

    const token = sessionStorage.getItem("token");

    // ⚠️ Construct the course object
    const newCourse = {
      courseId,
      title,
      description,
      lessons: lessonIds,
      status,
      totalCredit: totalCredit,
      owner
    };

    try {
      // ⚠️ Send POST request to the courses endpoint
      const res = await fetch("http://localhost:5050/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCourse),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Course saved:", data);
        setShowMessage(true);
        setTimeout(() => {
          navigate("/instructor-courses");
        }, 1000);
      } else {
        console.error("❌ Error:", data.error);
        setErrorMessage(data.error || "Failed to save course");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setErrorMessage("Server error: " + err.message);
    }
  }

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


  const handleClear = () => {
    setCourseId("");
    setTitle("");
    setDescription("");
    setLessonIds([]);
    setOwner(getUserFromToken());
    setShowMessage(false);
  };

  // Compact id for label
  const labelId = (l) => l.lessonId || (typeof l._id === "string" ? l._id.slice(-8) : "—");;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-teal-800">Create Course</h1>
        <Link
          to="/instructor-courses"
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </Link>
      </div>

      <section className="mt-4 grid gap-4 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
        {/* Course ID */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Course ID</label>
          <input
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="e.g., C2001"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
        </div>

        {/* Course title */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Course title</label>
          <input
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="e.g., Computer Science"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Description</label>
          <textarea
            className="min-h-[96px] rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="What does this course cover?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Lessons (checklist) */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-teal-800">Lessons</label>
            {!loadingLessons && lessons.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-md border border-teal-200 px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-md border border-teal-200 px-2 py-1 text-xs text-teal-700 hover:bg-teal-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {loadingLessons ? (
            <div className="text-sm text-slate-500">Loading lessons…</div>
          ) : lessons.length === 0 ? (
            <div className="text-sm text-slate-500">No lessons available</div>
          ) : (
            <div className="max-h-72 overflow-auto rounded-md border border-teal-200 p-3">
              <ul className="space-y-2">
                {lessons.map((l) => {
                  const value = String(l._id);
                  const checked = lessonIds.includes(value);
                  const inputId = `lesson-${value}`;
                  const creditValue =l.creditPoints;
                  
                  return (
                    <li key={value} className="flex items-start gap-3">
                      <input
                        id={inputId}
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                        checked={checked}
                        onChange={() => toggleLesson(value)}
                      />
                      <label htmlFor={inputId} className="cursor-pointer">
                        <div className="text-sm font-medium text-slate-900">
                          {labelId(l)} — {l.title || "Untitled lesson"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Credit: {creditValue}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Status dropdown */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Status</label>
          <select
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>


        {/* Total credit (read-only, calculated automatically) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Total Credit Points</label>
          <div>
            {totalCredit}
          </div>

        </div>

        {/* Owner (read-only) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Owner</label>
          <div>
            {owner}
          </div>
        </div>

        {/* Created & Last Updated */}
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
        <div className="flex justify-end">
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
            className="ml-2 rounded-md border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            Clear
          </button>
        </div>
      </section>

      {/* Visual success toast */}
      {showMessage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">
            Course created successfully!
          </div>
        </div>
      )}
    </main>
  );
}
