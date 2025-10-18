// src/pages/InstructorLessons.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon, PersonIcon } from "../components/Icons";

export default function InstructorLessons() {
  // Sidebar menu items
  const instructorMenu = [
    { path: "/instructor-lessons", label: "Lessons", icon: BookIcon },
    { path: "/instructor-courses", label: "Courses", icon: CourseIcon },
    { path: "/instructor-classroom", label: "Classroom", icon: ClassroomIcon },
    { path: "/instructor-student-list", label: "Student List", icon: UsersIcon },
    { path: "/instructor-manage-courses", label: "Manage Courses", icon: CourseIcon },
    { path: "/instructor-manage-lessons", label: "Manage Lessons", icon: BookIcon },
    { path: "/instructor-manage-classroom", label: "Manage Classroom", icon: ClassroomIcon }, // ← this page
  ];

  // UI state
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  
  // ---- Helpers --------------------------------------------------------------

  // Prefer a robust "owner" display similar to Courses page
  const getOwner = (lesson) =>
    lesson.ownerName ??
    (typeof lesson.createdBy === "object"
      ? lesson.createdBy.name || lesson.createdBy.email || lesson.createdBy.username
      : lesson.createdBy) ??
    "—";

  // Match the short ID chip style you used elsewhere (strip ObjectId wrapper and slice)
  const getDisplayId = (lesson) => {
    const raw = lesson.lessonId || lesson.id || lesson._id || "";
    const cleaned = String(raw).replace(/^ObjectId\("?(.*)"?\)$/, "$1");
    return lesson.lessonId || (cleaned ? cleaned.slice(-8) : "—");
  };

  // Normalize statuses just like in InstructorCourse.jsx
  const getStatus = (l) => {
    const s = typeof l.status === "string" ? l.status.toLowerCase() : "";
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    if (l.isArchived || l.archived) return "Archived";
    if (l.isPublished || l.published) return "Published";
    return "Draft";
  };

  // Compute a label + class for the status chip
  const getStatusChip = (l) => {
    const status = getStatus(l);
    const cls =
      status === "Published"
        ? "bg-green-100 text-green-700"
        : status === "Draft"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-700";
    return { status, cls };
  };

  // Safely read credit points for a lesson (prefer numeric "creditPoints"; fall back if needed)
  const getCreditPoints = (l) => {
    // If your schema uses "creditPoints" for lessons, this will just work.
    // If older data stored it as "totalCredit" or inside metadata, we try fallbacks.
    const cp =
      l.creditPoints ??
      l.totalCredit ??
      (typeof l.estimatedWork === "number" ? l.estimatedWork : undefined);
    return typeof cp === "number" && !Number.isNaN(cp) ? cp : undefined;
  };

  // ---- Effects --------------------------------------------------------------

  // Fetch lessons on mount
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token"); // JWT token

      try {
        const res = await fetch("http://localhost:5050/lessons", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          let msg = "Failed to fetch lessons";
          try {
            const errorData = await res.json();
            msg = errorData.error || msg;
          } catch {
            // ignore JSON parse error
          }
          throw new Error(msg);
        }

        const data = await res.json();
        setLessons(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  // ---- Actions --------------------------------------------------------------

  // Delete one lesson (with modal confirmation)
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:5050/lessons/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete lesson");

      // Remove from local state so the UI updates
      setLessons((prev) => prev.filter((l) => l._id !== deleteTarget._id));
      setDeleteTarget(null);

      setSuccessMessage("Lesson deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 1000);
    } catch (err) {
      console.error("Error deleting lesson:", err);
      alert("❌ Failed to delete lesson. Please try again.");
    }
  };

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="flex">
      {/* Sidebar with instructor menu */}
      <Sidebar items={instructorMenu} />

      {/* Main content */}
      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">Existing lessons</h1>

          <Link to="/instructor-create-lessons">
            <button
              type="button"
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              + New lesson
            </button>
          </Link>
        </div>

        {/* Filter bar (uses normalized statuses to match Courses page behavior) */}
        <div className="mt-4 flex gap-2">
          {["All", "Published", "Archived", "Draft"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === status
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search bar */}
        
        <div className="mt-6 mb-4">
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </div>
        

        {/* Loading / Error states */}
        {loading && <p className="mt-4 text-gray-500">Loading lessons...</p>}
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {/* Lessons grid */}
        {!loading && !error && (
          <>
            {lessons.length === 0 ? (
              <div className="mt-4 rounded-xl border border-teal-200 bg-white p-6 text-slate-700">
                <p className="font-medium">No lessons yet.</p>
                <p className="mt-1 text-sm text-slate-500">Create your first lesson to get started.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lessons
                  .filter((lesson) => {
                    if (statusFilter === "All") return true;
                    return getStatus(lesson) === statusFilter;
                  })
                  .filter((lesson) => {
                    if (!search.trim()) return true;
                    return (
                      lesson.title?.toLowerCase().includes(search.toLowerCase()) ||
                      getDisplayId(lesson).toLowerCase().includes(search.toLowerCase()) ||
                      getOwner(lesson).toLowerCase().includes(search.toLowerCase())
                    );
                  })
                  .map((lesson) => {
                    const owner = getOwner(lesson);
                    const displayId = getDisplayId(lesson);
                    const { status, cls: statusCls } = getStatusChip(lesson);
                    const creditPoints = getCreditPoints(lesson);

                    return (
                      <div
                        key={lesson._id}
                        className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
                      >
                        {/* Title links to the content page and passes the full lesson via state */}
                        <h2 className="text-lg font-semibold">
                          <Link
                            to={`/instructor-lessons-content/${lesson._id}`}
                            state={{ lesson, backTo: "/instructor-lessons" }}
                            className="hover:underline"
                          >
                            {lesson.title || "Untitled lesson"}
                          </Link>
                        </h2>

                        {/* Owner + ID under the title */}
                        <p className="mt-1 text-sm text-slate-500">
                          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                            ID: {displayId}
                          </span>
                          <span className="ml-2">{owner}</span>
                        </p>

                        {/* Credit Points chip (mirrors Courses page look & feel) */}
                        {creditPoints !== undefined && (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              Credit Points: {creditPoints}
                            </span>
                          </p>
                        )}

                        {/* Status chip (normalized) */}
                        <span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusCls}`}>
                          {status}
                        </span>

                        {/* Edit / Delete actions */}
                        <Link
                          to={`/instructor-edit-lessons/${lesson._id}`}
                          className="absolute top-2 right-10 text-teal-600 hover:text-teal-800"
                          title="Edit lesson"
                        >
                          🖉
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(lesson)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                          title="Delete lesson"
                        >
                          🗑
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h2 className="text-lg font-semibold text-teal-800 mb-4">Confirm Delete</h2>
              <p className="mb-6">
                Are you sure you want to delete <span className="font-medium">{deleteTarget.title}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleDelete}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual success toast */}
        {successMessage && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">{successMessage}</div>
          </div>
        )}
      </main>
    </div>
  );
}
