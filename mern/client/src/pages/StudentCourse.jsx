// src/pages/StudentCourse.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { CourseIcon, ClassroomIcon, BookIcon } from "../components/Icons";

export default function StudentCourse() {
  // Sidebar menu for student
  const studentMenu = [
    { path: "/student-course", label: "Courses", icon: CourseIcon },
    { path: "/student-classroom", label: "Classrooms", icon: ClassroomIcon },
    { path: "/student-lessons", label: "Lessons", icon: BookIcon },
  ];

  // UI state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolled, setEnrolled] = useState([]);
  const [view, setView] = useState("All");
  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [courseToUnenrol, setCourseToUnenrol] = useState(null);

  // ✅ fetch all published courses
  const fetchCourses = async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch("http://localhost:5050/courses/published", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch courses");
    return res.json();
  };

  // ✅ fetch student info (enrolled course)
  const fetchStudent = async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch("http://localhost:5050/api/students/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch student info");
    return res.json();
  };

  // ✅ fetch student grades + progress
const fetchGrades = async (studentId) => {
  const token = sessionStorage.getItem("token");
  try {
    const res = await fetch(`http://localhost:5050/grades/progress/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch grades");
    return res.json();
  } catch (err) {
    console.error("Error fetching grades:", err);
    return null;
  }
};


  // ✅ load courses + student info + attach progress from grades
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [courseData, studentData] = await Promise.all([
        fetchCourses(),
        fetchStudent(),
      ]);

      let enrolledCourseId = studentData.course?._id || null;
      setEnrolled(enrolledCourseId ? [enrolledCourseId] : []);
      setEnrolledCourse(enrolledCourseId);

      // ✅ now get progress from backend
      const progressData = await fetchGrades(studentData.id);

      const withProgress = await Promise.all(
        courseData.map(async (course) => {
          let percent = 0;
          if (enrolledCourseId === course._id && progressData) {
            percent = Math.round(progressData.progress || 0);
          }
          return { ...course, progress: percent };
        })
      );

      setCourses(Array.isArray(withProgress) ? withProgress : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayId = (c) =>
    c.courseId ||
    (typeof c._id === "string"
      ? c._id.replace(/^ObjectId\("?(.*)"?\)$/, "$1").slice(-8)
      : "—");

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

  // enrol / unenrol logic (unchanged)
  const handleEnrol = async (course) => {
    if (enrolledCourse) {
      setToastMessage(
        "You must finish or unenrol from your current course before starting a new one."
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5050/courses/${course._id}/enrol`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enrol");

      setEnrolled([course._id]);
      setEnrolledCourse(course._id);

      setToastMessage("Successfully enrolled!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMessage("Failed to enrol. Please try again.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleUnenrol = async (course) => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(
        `http://localhost:5050/courses/${course._id}/unenrol`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unenrol");

      setEnrolled([]);
      setEnrolledCourse(null);

      setToastMessage("You have unenrolled successfully");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMessage(err.message || "Failed to unenrol");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const visibleCourses =
    view === "My"
      ? courses.filter((c) => enrolled.includes(c._id))
      : courses
          .filter((c) => !enrolled.includes(c._id))
          .filter(
            (c) =>
              c.title?.toLowerCase().includes(search.toLowerCase()) ||
              displayId(c).toLowerCase().includes(search.toLowerCase()) ||
              ownerOf(c).toLowerCase().includes(search.toLowerCase())
          );

  const handleUnenrolClick = (course) => {
    setCourseToUnenrol(course);
    setShowModal(true);
  };

  const confirmUnenrol = () => {
    if (courseToUnenrol) handleUnenrol(courseToUnenrol);
    setShowModal(false);
    setCourseToUnenrol(null);
  };

  const cancelUnenrol = () => {
    setShowModal(false);
    setCourseToUnenrol(null);
  };

  return (
    <div className="flex">
      <Sidebar items={studentMenu} />

      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            {view === "My" ? "My Courses" : "All Courses"}
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setView("My")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                view === "My"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              My Courses
            </button>
            <button
              onClick={() => setView("All")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                view === "All"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Courses
            </button>
          </div>
        </div>

        {view === "All" && (
          <div className="mt-6 mb-4">
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
            />
          </div>
        )}

        {loading && <p className="mt-4 text-gray-500">Loading courses…</p>}
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <>
            {visibleCourses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-teal-200 bg-white p-6 text-slate-700">
                <p className="font-medium">
                  {view === "My"
                    ? "You haven't enrolled in any courses yet."
                    : "No courses available."}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => {
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
                      className={`relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md ${
                        view === "My" ? "min-h-[220px]" : ""
                      }`}
                    >
                      <h2 className="text-lg font-semibold">
                        <Link
                          to="/student-course-content"
                          state={{ course, backTo: "/student-course" }}
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

                      <span
                        className={`mt-3 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusCls}`}
                      >
                        {status}
                      </span>

                      {/* ✅ Progress bar for My Courses */}
                      {view === "My" && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{course.progress ?? 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-teal-600"
                              style={{ width: `${course.progress ?? 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Enrol / Unenrol button */}
                      {!enrolled.includes(course._id) ? (
                        <button
                          onClick={() => handleEnrol(course)}
                          className="mt-3 w-full rounded-md bg-teal-600 px-2 py-1 text-sm font-medium text-white hover:bg-teal-700"
                        >
                          Enrol
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnenrolClick(course)}
                          className="mt-3 w-full rounded-md bg-orange-200 text-orange-800 px-2 py-1 text-xs font-medium shadow-sm hover:bg-orange-300 transition-colors duration-200"
                        >
                          Unenrol
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Confirm Unenrol
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to unenrol from "
                {courseToUnenrol?.title}"?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelUnenrol}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnenrol}
                  className="px-4 py-2 rounded-md bg-orange-200 text-orange-800 hover:bg-orange-300 transition-colors duration-200"
                >
                  Yes, Unenrol
                </button>
              </div>
            </div>
          </div>
        )}

        {showToast && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 rounded-lg bg-yellow-100 border border-yellow-300 px-4 py-2 shadow-md text-yellow-800 text-sm font-medium">
            {toastMessage}
          </div>
        )}
      </main>
    </div>
  );
}
