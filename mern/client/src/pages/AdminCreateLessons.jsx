import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * CreateLessons
 * - Adds "Objective" textarea right below "Description".
 * - Moves the Back button to the top header (same placement style as others).
 */
export default function AdminCreateLessons() {
  const navigate = useNavigate();

  // --- Form state (visual only) ---
  const [id, setId] = useState(""); // optional
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState(""); // NEW: objective under description
  const [prereqIds, setPrereqIds] = useState([]); // array of selected IDs
  const [createdBy, setCreatedBy] = useState("");
  const [status, setStatus] = useState("Draft"); // draft | published | archived
  const [creditPoints, setCreditPoints] = useState(0);
  const [estimatedWork, setEstimatedWork] = useState(0);

  // Stackable rows
  const [readings, setReadings] = useState([{ title: "", url: "" }]); // Title + URL
  const [assignments, setAssignments] = useState([{ title: "" }]); // Title only

  // Visual-only Save feedback
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [existingLessons, setExistingLessons] = useState([]);
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

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
    setCreatedBy(getUserFromToken());
  }, []);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch("http://localhost:5050/lessons");
        if (!res.ok) throw new Error("Failed to fetch lessons");
        const data = await res.json();
        setExistingLessons(data);
      } catch (err) {
        console.error("❌ Error fetching lessons:", err);
      }
    }
    fetchLessons();
  }, []);

  async function handleSave() {
    if (!title || !description || !objective) {
      setErrorMessage("⚠️ Please fill in all required fields before saving.");
      return;
    }
    setErrorMessage(""); // clear old error if any

    const token = sessionStorage.getItem("token");

    const newLesson = {
      lessonId: id,
      title,
      description,
      objective,
      prerequisites: prereqIds,
      createdBy,
      status,
      creditPoints: Number(creditPoints),
      readings,
      assignments,
      estimatedWork,
    };

    try {
      const res = await fetch("http://localhost:5050/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLesson),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Lesson saved:", data);
        setShowMessage(true);
        setTimeout(() => {
          navigate("/instructor-lessons");
        }, 1000);
      } else {
        console.error("❌ Error:", data.error);
        alert(data.error || "Failed to save lesson");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Server error");
    }
  }

  const addReading = () => setReadings((r) => [...r, { title: "", url: "" }]);
  const removeReading = (i) => setReadings((r) => r.filter((_, idx) => idx !== i));

  const addAssignment = () => setAssignments((a) => [...a, { title: "" }]);
  const removeAssignment = (i) => setAssignments((a) => a.filter((_, idx) => idx !== i));

  function handleClear() {
    setId("");
    setTitle("");
    setDescription("");
    setObjective(""); // reset objective
    setPrereqIds([]);
    setStatus("Draft");
    setCreditPoints(0);
    setReadings([{ title: "", url: "" }]);
    setAssignments([{ title: "" }]);
    setShowMessage(false);
    setCreatedBy(getUserFromToken());
    setEstimatedWork(0);
    setCreatedAt("");
    setUpdatedAt("");
  }

  return (
    <div className="flex min-h-screen justify-center p-6">
      <main className="w-full max-w-4xl">
        {/* Top header with Back button (right) and title (left) */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">Create Lesson</h1>
          <button
            type="button"
            onClick={() => navigate("/admin-lessons")}
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

          {/* Lesson ID (optional) */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Lesson ID</label>
            <input
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g., FIT2101"
            />
          </div>

          {/* Title */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Lesson title *</label>
            <input
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Week 5: APIs & Fetch"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Description</label>
            <textarea
              className="min-h-[96px] rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn?"
            />
          </div>

          {/* Objective */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Objective</label>
            <textarea
              className="min-h-[96px] rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What should students be able to do after this lesson?"
            />
          </div>

          {/* Prerequisites (scrollable multi-select) */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Prerequisites</label>

            {/* Scroll container */}
            <div className="max-h-60 overflow-y-auto rounded-md border border-teal-200">
              {existingLessons.length === 0 ? (
                <div className="p-2 text-sm text-slate-500">No lessons found</div>
              ) : (
                existingLessons.map((lesson) => (
                  <label
                    key={lesson._id}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={prereqIds.includes(lesson._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPrereqIds((prev) => [...prev, lesson._id]);
                        } else {
                          setPrereqIds((prev) => prev.filter((id) => id !== lesson._id));
                        }
                      }}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-200"
                    />
                    <span className="text-sm truncate">
                      {lesson.lessonId ? `${lesson.lessonId} - ${lesson.title}` : lesson.title}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Created by */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-teal-800">Created by</label>
            <div>{createdBy}</div>
          </div>

          {/* Status & Credit points */}
          <div className="grid gap-2 md:grid-cols-2">
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
            <div className="grid gap-1">
              <label className="text-sm font-medium text-teal-800">Credit points</label>
              <input
                type="number"
                min="0"
                className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
                value={creditPoints}
                onChange={(e) => setCreditPoints(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Reading list */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-teal-800">Reading list</label>
              <button
                type="button"
                onClick={addReading}
                className="rounded-md border border-teal-200 px-2 py-1 text-sm text-teal-700 hover:bg-teal-50"
              >
                + Add
              </button>
            </div>
            {readings.map((r, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-5">
                <input
                  className="md:col-span-2 rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Title"
                  value={r.title}
                  onChange={(e) =>
                    setReadings((arr) =>
                      arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x))
                    )
                  }
                />
                <input
                  className="md:col-span-3 rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="URL (https://...)"
                  value={r.url}
                  onChange={(e) =>
                    setReadings((arr) =>
                      arr.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x))
                    )
                  }
                />
                <div className="md:col-span-5">
                  <button
                    type="button"
                    onClick={() => removeReading(i)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Assignments */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-teal-800">Assignments</label>
              <button
                type="button"
                onClick={addAssignment}
                className="rounded-md border border-teal-200 px-2 py-1 text-sm text-teal-700 hover:bg-teal-50"
              >
                + Add
              </button>
            </div>
            {assignments.map((a, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-5">
                <input
                  className="md:col-span-3 rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Assignment title"
                  value={a.title}
                  onChange={(e) =>
                    setAssignments((arr) =>
                      arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x))
                    )
                  }
                />
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeAssignment(i)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Work per Week */}
          <div className="grid gap-1 mt-3">
            <label className="text-sm font-medium text-teal-800">
              Estimated Work per Week (hours)
            </label>
            <input
              type="number"
              min="0"
              className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
              value={estimatedWork}
              onChange={(e) => setEstimatedWork(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>

          <div className="grid gap-1 text-sm text-slate-500 mt-2">
            <p>Created: {createdAt ? new Date(createdAt).toLocaleString() : "-"}</p>
            <p>Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}</p>
          </div>

          {/* Actions (Back removed here; only Save/Clear remain) */}
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

        {/* Visual success message only */}
        {showMessage && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">
              Lesson created successfully!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
