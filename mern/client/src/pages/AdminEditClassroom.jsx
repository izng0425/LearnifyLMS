// src/pages/EditClassroom.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function AdminEditClassroom() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { classroomId } = useParams();

  // Prefer data passed from the list; fall back to fetching by :classroomId
  const initial = state?.classroom || {
    _id: classroomId ?? "",
    classroomId: "",
    title: "",
    description: "",
    status: "Draft",
    ownerName: "",
    owner: "",
    courses: "",        // course _id (string)
    lessons: [],        // array of lesson ids/objects
    students: [],       // array of student ids/objects
    startTime: "",
    duration: "",
    createdAt: "",
    updatedAt: "",
  };

  // ---- Form state (mirrors CreateClassroom) ----
  const [id, setId] = useState(initial.classroomId || "");
  const [title, setTitle] = useState(initial.title || "");
  const [owner] = useState(initial.owner);
  const [courses, setCourse] = useState(() => {
    if (Array.isArray(initial.courses)) {
      const first = initial.courses[0];
      return typeof first === "object" ? first._id || first.id || "" : first || "";
    }
    if (typeof initial.courses === "object") {
      return initial.courses._id || initial.courses.id || "";
    }
    return initial.courses || "";
  });
  const [lessonIds, setLessonIds] = useState([]);   // selected lesson _ids
  const [studentIds, setStudentIds] = useState([]); // selected student _ids
  const [startTime, setStartTime] = useState(() => {
    if (!initial.startTime) return "";
    return new Date(initial.startTime).toISOString().slice(0, 16);});   const [duration, setDuration] = useState(initial.duration || "");
  const [status, setStatus] = useState(initial.status || "Draft");

  // Options
  const [existingCourses, setExistingCourses] = useState([]);
  const [existingLessons, setExistingLessons] = useState([]);
  const [existingStudents, setExistingStudents] = useState([]);

  // Meta
  const [createdAt, setCreatedAt] = useState(initial.createdAt || "");
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt || "");

  // UI
  const [error, setError] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const docId = initial._id || classroomId;

  // ---- Helpers ----
  const cleanId = (v) => String(v || "").replace(/^ObjectId\("?(.*?)"?\)$/, "$1");
  const labelId = (l) => l.lessonId || (typeof l._id === "string" ? cleanId(l._id).slice(-8) : "—");
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  function getUserFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email || payload.id || "";
    } catch {
      return "";
    }
  }

  // Normalize array of ids/objects -> array of string ids
  const normalizeIdArray = (arr) =>
    Array.isArray(arr)
      ? arr
          .map((x) =>
            typeof x === "object" ? cleanId(x._id || x.id) : cleanId(x)
          )
          .filter(Boolean)
      : [];

  // 1) If opened by URL (no state) or to refresh, fetch the classroom
  useEffect(() => {
    async function fetchClassroom() {
      if (!docId) return;
      if (state?.classroom?.title) {
        // We already have data; just normalize pre-selections
        setLessonIds(normalizeIdArray(initial.lessons));
        setStudentIds(normalizeIdArray(initial.students));
        if (!owner) setOwner(getUserFromToken());
        return;
      }

      const token = sessionStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5050/classrooms/${docId}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch classroom");
        const data = await res.json();

        setId(data.classroomId || "");
        setTitle(data.title || "");
        setOwner(data.ownerName || data.owner || getUserFromToken());
        setCourse(Array.isArray(data.courses) ? data.courses[0] || "" : data.courses || "");        setLessonIds(normalizeIdArray(data.lessons));
        setLessonIds(normalizeIdArray(data.lessons));
        setStudentIds(normalizeIdArray(data.students));
        setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16): "");
        setDuration(data.duration || "");
        setStatus(data.status || "Draft");
        setCreatedAt(data.createdAt || "");
        setUpdatedAt(data.updatedAt || "");
      } catch (err) {
        setError(err.message || "Failed to load classroom");
      }
    }
    fetchClassroom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // 2) Fetch courses once
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("http://localhost:5050/courses");
        if (res.ok) {
          const data = await res.json();
          setExistingCourses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    }
    fetchCourses();
  }, []);

  // 3) When a course is chosen, fetch its lessons and students
  useEffect(() => {
    if (!courses) {
      setExistingLessons([]);
      setExistingStudents([]);
      return;
    }

    async function fetchCourseData() {
      try {
        const lRes = await fetch(`http://localhost:5050/courses/${courses}/lessons`);
        if (lRes.ok) {
          const lessons = await lRes.json();
          setExistingLessons(Array.isArray(lessons) ? lessons : []);
          // keep only selected lessons that still belong to this course
          const validIds = new Set((Array.isArray(lessons) ? lessons : []).map((x) => cleanId(x._id)));
          setLessonIds((prev) => prev.filter((id) => validIds.has(cleanId(id))));
        } else {
          setExistingLessons([]);
          setLessonIds([]);
        }

        const sRes = await fetch(`http://localhost:5050/courses/${courses}/students`);
        if (sRes.ok) {
          const students = await sRes.json();
          setExistingStudents(Array.isArray(students) ? students : []);
          // keep only selected students that still belong to this course
          const validS = new Set((Array.isArray(students) ? students : []).map((x) => cleanId(x._id)));
          setStudentIds((prev) => prev.filter((id) => validS.has(cleanId(id))));
        } else {
          setExistingStudents([]);
          setStudentIds([]);
        }
      } catch (err) {
        console.error("Error fetching course lessons/students", err);
        setExistingLessons([]);
        setExistingStudents([]);
        setLessonIds([]);
        setStudentIds([]);
      }
    }

    fetchCourseData();
  }, [courses]);

  // toggle selections
  const toggleLesson = (lid) =>
    setLessonIds((prev) => (prev.includes(lid) ? prev.filter((x) => x !== lid) : [...prev, lid]));
  const toggleStudent = (sid) =>
    setStudentIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));

  const numStudents = useMemo(() => studentIds.length, [studentIds]);

  function handleReset() {
    setId(initial.classroomId || "");
    setTitle(initial.title || "");
    setCourse(typeof initial.courses === "string" ? initial.courses : "");
    setLessonIds(normalizeIdArray(initial.lessons));
    setStudentIds(normalizeIdArray(initial.students));
    setStartTime(initial.startTime || "");
    setDuration(initial.duration || "");
    setStatus(initial.status || "Draft");
    setCreatedAt(initial.createdAt || "");
    setUpdatedAt(initial.updatedAt || "");
    setError("");
  }

  async function handleUpdate() {
    if (!docId) {
      setError("Missing classroom id.");
      return;
    }
    if (!title.trim()) {
      setError("⚠️ Please fill in the title before updating.");
      return;
    }
    if (!courses || lessonIds.length === 0 || !startTime || !duration) {
      setError("⚠️ Please fill in all required fields (course, lessons, start time, duration).");
      return;
    }
    setError("");

    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5050/classrooms/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classroomId: id,
          title,
          description: initial.description || "", // keep if you later add description input
          status,
          ownerName: owner,
          courses,              // course _id
          lessons: lessonIds,   // array of lesson _ids
          students: studentIds, // array of student _ids
          startTime,
          duration,
          numStudents,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update classroom");

      // reflect timestamps from server if present
      if (data?.updatedAt) setUpdatedAt(data.updatedAt);
      if (data?.createdAt) setCreatedAt(data.createdAt);

      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
        navigate("/admin-classroom");
      }, 900);
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header with Back button at the top */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-teal-800">Edit Classroom</h1>
        <button
          type="button"
          onClick={() => navigate("/admin-classroom")}
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </button>
      </div>

      <section className="mt-4 grid gap-4 rounded-xl border border-teal-200 bg-white p-6 shadow-sm">
        {/* Classroom ID */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Classroom ID</label>
          <input
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="CR-101"
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

        {/* Owner (read-only) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Owner</label>
          <div>
            {owner}
          </div>
        </div>

        {/* Status */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Status *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
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

        {/* Lessons list (scrollable) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Lessons *</label>
          <div className="rounded-md border border-teal-200 px-3 py-2 max-h-48 overflow-auto">
            {existingLessons.length > 0 ? (
              <ul className="space-y-2">
                {existingLessons.map((l) => {
                  const value = String(l._id);
                  return (
                    <li key={value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={lessonIds.includes(value)}
                        onChange={() => toggleLesson(value)}
                      />
                      <span>{`${labelId(l)} - ${l.title || "Untitled lesson"}`}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No lessons found for this course</p>
            )}
          </div>
        </div>

        {/* Students list (scrollable) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Students</label>
          <div className="rounded-md border border-teal-200 px-3 py-2 max-h-48 overflow-auto">
            {existingStudents.length > 0 ? (
              <ul className="space-y-2">
                {existingStudents.map((s) => {
                  const sid = String(s._id);
                  return (
                    <li key={sid} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={studentIds.includes(sid)}
                        onChange={() => toggleStudent(sid)}
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

        {/* Start time */}
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
          <label className="text-sm font-medium text-teal-800">Duration of class (weeks) *</label>
          <input
            type="number"
            min="0"
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 90"
          />
        </div>

        {/* Number of students (derived) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Number of students</label>
          <div>{numStudents}</div>
        </div>

        {/* Created & Last updated (read-only) */}
        <div className="grid gap-1 text-sm text-slate-500 mt-2">
          <p>Created: {formatDate(createdAt)}</p>
          <p>Last updated: {formatDate(updatedAt)}</p>
        </div>

        {/* Errors */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            Update
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Success toast */}
      {showMessage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">
            Classroom updated successfully!
          </div>
        </div>
      )}
    </main>
  );
}
