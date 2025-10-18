import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, LogoutIcon, CourseIcon,ClassroomIcon, PersonIcon} from "../components/Icons"; // import CourseIcon too

export default function InstructorStudentList() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // paths now exactly match your router config
  const instructorMenu = [
    { path: "/instructor-lessons", label: "Lessons", icon: BookIcon },
    { path: "/instructor-courses", label: "Courses", icon: CourseIcon },
    { path: "/instructor-classroom", label: "Classroom", icon: ClassroomIcon },
    { path: "/instructor-student-list", label: "Student List", icon: UsersIcon },
    { path: "/instructor-manage-courses", label: "Manage Courses", icon: CourseIcon }, 
    { path: "/instructor-manage-lessons", label: "Manage Lessons", icon: BookIcon },
    { path: "/instructor-manage-classroom", label: "Manage Classroom", icon: ClassroomIcon }, // ← this page

  ];

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

  return (
    <div className="flex">
      <Sidebar items={instructorMenu} />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Student List (Instructor)
          </h1>
          <button
            onClick={fetchStudents}
            className="bg-teal-500 text-white px-3 py-1 rounded text-sm hover:bg-teal-600"
          >
            Refresh
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-teal-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">First name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Last name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Courses</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
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
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          student.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}

              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No students found in database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center text-gray-500 mt-4">Loading students...</div>
        )}
        {error && (
          <div className="text-red-500 text-center mt-4">{error}</div>
        )}
      </main>
    </div>
  );
}
