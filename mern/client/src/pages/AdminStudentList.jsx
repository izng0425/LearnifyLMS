import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

export default function AdminStudentList() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5050/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
      setError("");
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5050/api/students/${deleteTarget._id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete student");

      setStudents(students.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Failed to delete student. Please try again.");
    }
  };

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

  if (loading) {
    return (
      <div className="flex">
        <Sidebar items={adminMenu} />
        <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading students...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar items={adminMenu} />
        <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
          <div className="text-red-500 text-center p-4">{error}</div>
          <button
            onClick={fetchStudents}
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar items={adminMenu} />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Student List (Admin)
          </h1>
          <div className="flex flex-col items-end">
            <button
              onClick={fetchStudents}
              className="bg-teal-500 text-white px-3 py-1 rounded text-sm hover:bg-teal-600 mb-3"
            >
              Refresh
            </button>
            <div className="text-sm text-slate-600">
              Total Students: <span className="font-bold">{students.length}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-teal-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">First Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Last Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Courses</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students
                .filter((student) =>
                  student.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                  student.lastName?.toLowerCase().includes(search.toLowerCase()) ||
                  student.email?.toLowerCase().includes(search.toLowerCase())
                )
                .map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{student.firstName || "N/A"}</td>
                    <td className="px-4 py-3">{student.lastName || "N/A"}</td>
                    <td className="px-4 py-3">{student.email || student.username}</td>
                    <td className="px-4 py-3">
                    {student.course ? `${student.course.courseId} - ${student.course.title}` : "-"}
                    </td> 
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        student.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget(student)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500 transition-colors"
                    >
                    Remove
                  </button>
                    </td>
                  </tr>
                ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No students found in database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      </main>
    </div>
  );
}