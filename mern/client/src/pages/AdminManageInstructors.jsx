// src/pages/AdminManageInstructors.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminManageInstructors() {
  const navigate = useNavigate();

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

  // ---------- Instructor list states ----------
  const [search, setSearch] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5050/api/instructors", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch instructors");
      const data = await res.json();
      setInstructors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5050/api/instructors/${deleteTarget._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error("Failed to delete instructor");
      setInstructors((prev) => prev.filter((i) => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete instructor. Please try again.");
    }
  };

  const filtered = instructors.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.firstName?.toLowerCase().includes(q) ||
      t.lastName?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex">
      <Sidebar items={adminMenu} />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Manage Instructors
          </h1>
        </div>

        {/* Instructor list only */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading instructors…</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">
            {error}
            <button
              onClick={fetchInstructors}
              className="ml-4 bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={fetchInstructors}
                className="bg-teal-500 text-white px-3 py-1 rounded text-sm hover:bg-teal-600"
              >
                Refresh
              </button>
              <div className="text-sm text-slate-600">
                Total Instructors: <span className="font-bold">{instructors.length}</span>
              </div>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search instructors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
              />
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-teal-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">First Name</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Last Name</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{t.firstName || "N/A"}</td>
                      <td className="px-4 py-3">{t.lastName || "N/A"}</td>
                      <td className="px-4 py-3">{t.email || t.username || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            t.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="px-2 py-1 bg-teal-500 text-white rounded text-xs hover:bg-teal-600 transition-colors"
                            onClick={() => {
                              navigate(`/admin-view-instructor`, {
                                state: { instructor: t },
                              });
                            }}
                          >
                            View Report
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                            onClick={() => setDeleteTarget(t)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        No instructors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Delete confirmation modal */}
            {deleteTarget && (
              <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                  <h2 className="text-lg font-semibold text-teal-800 mb-4">Confirm Delete</h2>
                  <p className="mb-6">
                    Are you sure you want to delete{" "}
                    <span className="font-medium">
                      {deleteTarget.firstName} {deleteTarget.lastName}
                    </span>
                    ?
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
          </>
        )}
      </main>
    </div>
  );
}
