// src/pages/AdminCourse.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

export default function AdminCourse() {
  // Sidebar menu for admin
  const adminMenu = [
    { path: "/admin-lessons", label: "Lessons", icon: BookIcon },
    { path: "/admin-courses", label: "Courses", icon: CourseIcon },
    { path: "/admin-classroom", label: "Classroom", icon: ClassroomIcon },
    { path: "/admin-student-list", label: "Student List", icon: UsersIcon },
    { path: "/admin-manage-instructors", label: "Manage Instructor", icon: UsersIcon },
    { path: "/admin-manage-courses", label: "Manage Courses", icon: CourseIcon },
    { path: "/admin-manage-lessons", label: "Manage Lessons", icon: BookIcon }, 
    { path: "/admin-manage-classroom", label: "Manage Classroom", icon: ClassroomIcon },
  ];

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("token");
      try {
        // change endpoint if admin has a special one
        const res = await fetch("http://localhost:5050/courses", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:5050/courses/${deleteTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete course");
      setCourses((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      setSuccessMessage("Course deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 1000);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete course. Please try again.");
    }
  };

  const displayId = (c) =>
    c.courseId ||
    (typeof c._id === "string" ? c._id.replace(/^ObjectId\("?(.*)"?\)$/, "$1").slice(-8) : "—");

  const ownerOf = (c) =>
    c.ownerName ||
    c.owner ||
    (typeof c.createdBy === "object"
      ? c.createdBy.name || c.createdBy.email || c.createdBy.username
      : c.createdBy) ||
    "—";

  const getStatus = (c) => {
    const s = typeof c.status === "string" ? c.status.toLowerCase() : "";
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    if (c.isArchived || c.archived) return "Archived";
    if (c.isPublished || c.published) return "Published";
    return "Draft";
  };

  return (
    <div className="flex">
      <Sidebar items={adminMenu} />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">Existing courses</h1>
          <Link to="/admin-create-courses">
            <button
              type="button"
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              + New course
            </button>
          </Link>
        </div>

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

        <div className="mt-6 mb-4">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </div>

        {loading && <p className="mt-4 text-gray-500">Loading courses…</p>}
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <>
            {courses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-teal-200 bg-white p-6 text-slate-700">
                <p className="font-medium">No courses yet.</p>
                <p className="mt-1 text-sm text-slate-500">Create your first course to get started.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses
                  .filter((c) => statusFilter === "All" || getStatus(c) === statusFilter)
                  .filter((course) => {
                    if (!search.trim()) return true;
                    return (
                      course.title?.toLowerCase().includes(search.toLowerCase()) ||
                      displayId(course).toLowerCase().includes(search.toLowerCase()) ||
                      ownerOf(course).toLowerCase().includes(search.toLowerCase())
                    );
                  })
                  .map((course) => {
                    const id = displayId(course);
                    const owner = ownerOf(course);
                    const status = getStatus(course);
                    const statusCls =
                      status === "Published"
                        ? "bg-green-100 text-green-700"
                        : status === "Draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700";

                    return (
                      <div
                        key={course._id}
                        className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
                      >
                        <h2 className="text-lg font-semibold">
                          <Link
                            to="/admin-courses-content"
                            state={{ course, backTo: "/admin-courses" }}
                            className="hover:underline"
                          >
                            {course.title || "Untitled course"}
                          </Link>
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                            ID: {id}
                          </span>
                          <span className="ml-2">{owner}</span>
                        </p>

                        {course.totalCredit !== undefined && (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              Credit Points: {course.totalCredit}
                            </span>
                          </p>
                        )}

                        <span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusCls}`}>
                          {status}
                        </span>

                        <Link
                          to="/admin-edit-courses"
                          state={{ course }}
                          className="absolute top-2 right-10 text-teal-600 hover:text-teal-800"
                          title="Edit course"
                        >
                          🖉
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(course)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                          title="Delete course"
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

        {successMessage && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">{successMessage}</div>
          </div>
        )}
      </main>
    </div>
  );
}
