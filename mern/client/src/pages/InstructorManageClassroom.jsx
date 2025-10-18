// src/pages/InstructorManageClassroom.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

export default function InstructorManageClassroom() {
  // Sidebar
  const instructorMenu = [
    { path: "/instructor-lessons", label: "Lessons", icon: BookIcon },
    { path: "/instructor-courses", label: "Courses", icon: CourseIcon },
    { path: "/instructor-classroom", label: "Classroom", icon: ClassroomIcon },
    { path: "/instructor-student-list", label: "Student List", icon: UsersIcon },
    { path: "/instructor-manage-courses", label: "Manage Courses", icon: CourseIcon },
    { path: "/instructor-manage-lessons", label: "Manage Lessons", icon: BookIcon },
    { path: "/instructor-manage-classroom", label: "Manage Classroom", icon: ClassroomIcon }, // ← this page
  ];

  // State
  const [activeTab, setActiveTab] = useState("classroomList"); // "classroomList" | "summary"
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch classrooms
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5050/classrooms/my-created", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch classrooms");
        const data = await res.json();
        setClassrooms(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Helpers - Updated to match Published, Archived, Draft
  const getStatus = (c) => {
    const s = typeof c.status === "string" ? c.status.toLowerCase() : "";
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    if (c.isArchived || c.archived) return "Archived";
    if (c.isPublished || c.published) return "Published";
    return "Draft";
  };

  const avgStudents = useMemo(() => {
    if (classrooms.length === 0) return undefined;
    const totalStudents = classrooms.reduce(
      (sum, c) => sum + (c.studentCount || 0),
      0
    );
    return totalStudents / classrooms.length;
  }, [classrooms]);

  // Summary counts
  const statusCounts = useMemo(() => {
    const counts = { Published: 0, Draft: 0, Archived: 0 };
    classrooms.forEach((c) => {
      const s = getStatus(c);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [classrooms]);

  // ---- Render ----
  return (
    <div className="flex">
      <Sidebar items={instructorMenu} />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Manage Classroom
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { key: "classroomList", label: "Classroom List" },
            { key: "summary", label: "Summary" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Total count */}
        <div className="mb-6 text-right text-sm font-medium text-gray-800">
          Total Classrooms: <span className="font-bold">{classrooms.length}</span>
        </div>

        {/* Table View */}
        {activeTab === "classroomList" && (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading classrooms…</p>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-teal-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        Classroom
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                        Students Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {classrooms.map((c) => {
                      const status = getStatus(c);
                      return (
                        <tr key={c._id || c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            {c.name || c.title || "Untitled Classroom"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                status === "Published"
                                  ? "bg-green-100 text-green-800"
                                  : status === "Archived"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {c.studentCount || "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {classrooms.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No classrooms found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Summary View */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            <KPIBlock
              title="Average Students per Classroom"
              value={
                avgStudents !== undefined ? avgStudents.toFixed(2) : "—"
              }
            />
            <StatBlock
              title="Classrooms by Status"
              items={[
                { label: "Published", value: statusCounts.Published || 0 },
                { label: "Draft", value: statusCounts.Draft || 0 },
                { label: "Archived", value: statusCounts.Archived || 0 },
              ]}
            />
          </div>
        )}
      </main>
    </div>
  );
}

/** KPI block (for numeric stats) */
function KPIBlock({ title, value }) {
  const isAverage = title === "Average Students per Classroom";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3
        className={`mb-2 ${
          isAverage
            ? "text-base font-bold text-gray-800"
            : "text-sm font-semibold text-gray-600"
        }`}
      >
        {title}
      </h3>
      <p className="text-2xl font-bold text-teal-700">{value}</p>
    </div>
  );
}

/** List block (for grouped counts) */
function StatBlock({ title, items }) {
  const isStatus = title === "Classrooms by Status";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-1">
      <h3
        className={`mb-3 ${
          isStatus
            ? "text-base font-bold text-gray-800"
            : "text-sm font-semibold text-gray-600"
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.label} className="flex justify-between">
            <span className="text-gray-700">{x.label}</span>
            <span className="font-semibold text-gray-900">{x.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
