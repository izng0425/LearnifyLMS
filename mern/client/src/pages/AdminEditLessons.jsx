// src/pages/AdminEditLessons.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/**
 * AdminEditLessons
 * - Prevents selecting THIS lesson as a prerequisite (hidden + extra guard).
 * - Keeps the form prefilled with existing data.
 * - Sanitizes prerequisites on load and before update.
 */
export default function AdminEditLessons() {
  const navigate = useNavigate();
  const { lessonId } = useParams(); // current document _id from the route

  // Keep both the document _id and the human-friendly lessonId (code)
  const [docId, setDocId] = useState(""); // actual _id of this lesson
  const [id, setId] = useState("");       // lessonId code, e.g. "W2"

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [prereqIds, setPrereqIds] = useState([]);
  const [createdBy, setCreatedBy] = useState("");
  const [status, setStatus] = useState("Draft");
  const [creditPoints, setCreditPoints] = useState(0);
  const [estimatedWork, setEstimatedWork] = useState(0);

  const [readings, setReadings] = useState([{ title: "", url: "" }]);
  const [assignments, setAssignments] = useState([{ title: "" }]);

  const [existingLessons, setExistingLessons] = useState([]);
  const [error, setError] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // ---------- Helpers ----------
  const byStr = (v) => (v == null ? "" : String(v));
  const sameId = (a, b) => byStr(a) === byStr(b);

  function getUserFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email || payload.id || payload.username || "";
    } catch {
      return "";
    }
  }

  // ---------- Row helpers ----------
  const addReading = () => setReadings((r) => [...r, { title: "", url: "" }]);
  const removeReading = (i) => setReadings((r) => r.filter((_, idx) => idx !== i));

  const addAssignment = () => setAssignments((a) => [...a, { title: "" }]);
  const removeAssignment = (i) => setAssignments((a) => a.filter((_, idx) => idx !== i));

  // ---------- Reset ----------
  function handleReset() {
    setId("");
    setTitle("");
    setDescription("");
    setObjective("");
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

  // ---------- Load lesson ----------
  useEffect(() => {
    if (!lessonId) return;
    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:5050/lessons/${lessonId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch lesson");
        return res.json();
      })
      .then((data) => {
        const currentId = byStr(data._id || lessonId);
        setDocId(currentId);

        // Prefill form
        setId(data.lessonId || "");
        setTitle(data.title || "");
        setDescription(data.description || "");
        setObjective(data.objective || "");
        setCreatedBy(data.createdBy || "");
        setStatus(data.status || "Draft");
        setCreditPoints(Number.isFinite(Number(data.creditPoints)) ? Number(data.creditPoints) : 0);
        setReadings(Array.isArray(data.readings) && data.readings.length ? data.readings : [{ title: "", url: "" }]);
        setAssignments(Array.isArray(data.assignments) && data.assignments.length ? data.assignments : [{ title: "" }]);
        setEstimatedWork(Number.isFinite(Number(data.estimatedWork)) ? Number(data.estimatedWork) : 0);
        setCreatedAt(data.createdAt || "");
        setUpdatedAt(data.updatedAt || "");

        // Remove "self" from prerequisites if present
        const rawPrereqs = Array.isArray(data.prerequisites) ? data.prerequisites : [];
        setPrereqIds(rawPrereqs.filter((x) => !sameId(x, currentId)));
      })
      .catch((err) => setError(err.message));
  }, [lessonId]);

  // ---------- Load all lessons for prerequisite list ----------
  useEffect(() => {
    async function fetchLessons() {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch("http://localhost:5050/lessons", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch lessons");
        const data = await res.json();
        setExistingLessons(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching lessons:", err);
      }
    }
    fetchLessons();
  }, []);

  // ---------- Update ----------
  async function handleUpdate() {
    if (!title.trim() || !description.trim()) {
      setError("⚠️ Please fill in all required fields before updating.");
      return;
    }

    // Safety: do not send self as a prerequisite
    const sanitizedPrereqs = prereqIds.filter((x) => !sameId(x, docId || lessonId));

    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5050/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lessonId: id,
          title,
          description,
          objective,
          prerequisites: sanitizedPrereqs,
          status,
          creditPoints: Number(creditPoints) || 0,
          readings,
          assignments,
          createdBy,
          estimatedWork: Number(estimatedWork) || 0,
        }),
      });

      if (!res.ok) {
        let msg = "Failed to update lesson";
        try {
          const errorData = await res.json();
          msg = errorData.error || msg;
        } catch {}
        throw new Error(msg);
      }

      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
        navigate("/admin-lessons");
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  }

  // ---------- Render ----------
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header with back */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-teal-800">Edit Lesson</h1>
        <button
          type="button"
          onClick={() => navigate("/admin-lessons")}
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </button>
      </div>

      <section className="mt-4 grid gap-4 rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
        {/* Lesson ID (human-friendly code) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Lesson ID</label>
          <input
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g., W2"
          />
        </div>

        {/* Title */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Lesson title *</label>
          <input
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Week 2: HTML & CSS Basics"
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

        {/* Prerequisites (self hidden + guarded) */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Prerequisites</label>
          <div className="max-h-60 overflow-y-auto rounded-md border border-teal-200 divide-y divide-teal-100">
            {existingLessons.length === 0 ? (
              <div className="p-2 text-sm text-slate-500">No lessons found</div>
            ) : (
              existingLessons.map((lesson) => {
                // Hide this lesson itself from the list
                if (sameId(lesson._id, docId || lessonId)) return null;

                const checked = prereqIds.some((x) => sameId(x, lesson._id));

                return (
                  <label key={lesson._id} className="flex items-center gap-2 p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        // Extra guard (should be hidden anyway)
                        if (sameId(lesson._id, docId || lessonId)) return;
                        if (e.target.checked) {
                          setPrereqIds((prev) =>
                            prev.some((x) => sameId(x, lesson._id)) ? prev : [...prev, lesson._id]
                          );
                        } else {
                          setPrereqIds((prev) => prev.filter((x) => !sameId(x, lesson._id)));
                        }
                      }}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-200"
                    />
                    <span className="text-sm truncate" title={lesson.title}>
                      {lesson.lessonId ? `${lesson.lessonId} - ${lesson.title}` : lesson.title}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Created by */}
        <div className="grid gap-1">
          <label className="text-sm font-medium text-teal-800">Created by</label>
          <div className="text-slate-700">{createdBy || "—"}</div>
        </div>

        {/* Status & Credits */}
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
                  setReadings((arr) => arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))
                }
              />
              <input
                className="md:col-span-3 rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="URL (https://...)"
                value={r.url}
                onChange={(e) =>
                  setReadings((arr) => arr.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))
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
                  setAssignments((arr) => arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))
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

        {/* Estimated Work */}
        <div className="grid gap-1 mt-3">
          <label className="text-sm font-medium text-teal-800">Estimated Work per Week (hours)</label>
          <input
            type="number"
            min="0"
            className="rounded-md border border-teal-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-200"
            value={estimatedWork}
            onChange={(e) => setEstimatedWork(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>

        {/* Meta */}
        <div className="grid gap-1 text-sm text-slate-500 mt-2">
          <p>Created: {createdAt ? new Date(createdAt).toLocaleString() : "-"}</p>
          <p>Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}</p>
        </div>

        {/* Actions */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Update
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="ml-2 rounded-md border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Success popup */}
      {showMessage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-teal-600 text-white px-6 py-4 rounded-lg shadow-lg">
            Lesson updated successfully!
          </div>
        </div>
      )}
    </main>
  );
}
