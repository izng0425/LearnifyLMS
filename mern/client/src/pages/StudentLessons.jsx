// src/pages/StudentLessons.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

export default function StudentLessons() {
  const studentMenu = [
    { path: "/student-course", label: "Courses", icon: CourseIcon },
    { path: "/student-classroom", label: "Classrooms", icon: ClassroomIcon },
    { path: "/student-lessons", label: "Lessons", icon: BookIcon },
  ];

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const token = sessionStorage.getItem("token");

  // Helpers
  const getOwner = (lesson) =>
    lesson.ownerName ??
    (typeof lesson.createdBy === "object"
      ? lesson.createdBy.name ||
        lesson.createdBy.email ||
        lesson.createdBy.username
      : lesson.createdBy) ??
    "—";

  const getDisplayId = (lesson) => {
    const raw = lesson.lessonId || lesson.id || lesson._id || "";
    const cleaned = String(raw).replace(/^ObjectId\("?(.*)"?\)$/, "$1");
    return lesson.lessonId || (cleaned ? cleaned.slice(-8) : "—");
  };

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      setError("");

      try {
        const studentRes = await fetch("http://localhost:5050/api/students/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!studentRes.ok) throw new Error("Failed to fetch student info");
        const student = await studentRes.json();

        if (!student.course || !student.course._id) {
          setLessons([]);
          setLoading(false);
          return;
        }

        const courseRes = await fetch(
        `http://localhost:5050/courses/${student.course._id}/published-lessons`,
          { headers: {Authorization: `Bearer ${token}`} }
        );
        if (!courseRes.ok) throw new Error("Failed to fetch course");
        const courseData = await courseRes.json();

        // Add mock statuses for demo (later replace with real API field `lesson.status`)
        const withStatuses = (Array.isArray(courseData) ? courseData : []).map(
          (l, idx) => ({
            ...l,
            status:
              idx % 3 === 0
                ? "not_started"
                : idx % 3 === 1
                ? "failed"
                : "completed",
          })
        );

        setLessons(withStatuses);
      } catch (err) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, [token]);

  return (
    <div className="flex">
      <Sidebar items={studentMenu} />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            My Lessons
          </h1>
        </div>

        {/* Search */}
        <div className="mt-6 mb-4">
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </div>

        {loading && <p className="text-gray-500">Loading lessons...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <>
            {lessons.length === 0 ? (
              <div className="rounded-xl border border-teal-200 bg-white p-6 text-slate-600">
                You don’t have any lessons yet. Enrol into a course.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lessons
                  .filter((l) =>
                    l.title?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((lesson) => {
                    const owner = getOwner(lesson);
                    const displayId = getDisplayId(lesson);

                    // Status styles
                    const statusStyles = {
                      not_started: {
                        bg: "bg-blue-100 border-blue-300",
                        badge: "bg-blue-200 text-blue-800",
                        text: "Not started",
                      },
                      failed: {
                        bg: "bg-red-100 border-red-300",
                        badge: "bg-red-200 text-red-800",
                        text: "Failed",
                      },
                      completed: {
                        bg: "bg-green-100 border-green-300",
                        badge: "bg-green-200 text-green-800",
                        text: "Completed",
                      },
                    };

                    const { bg, badge, text } =
                      statusStyles[lesson.status] || statusStyles["not_started"];

                    return (
                      <div
                        key={lesson._id}
                        className={`relative rounded-lg border p-4 shadow-sm hover:shadow-md ${bg}`}
                      >
                        {/* Status badge */}
                        <span
                          className={`absolute top-2 right-2 rounded-md px-2 py-0.5 text-xs font-medium ${badge}`}
                        >
                          {text}
                        </span>

                        {/* Title */}
                        <h2 className="text-lg font-semibold text-teal-800">
                          {lesson.title || "Untitled lesson"}
                        </h2>

                        {/* ID + Creator */}
                        <p className="mt-1 text-sm text-slate-600">
                          <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs">
                            ID: {displayId}
                          </span>
                          <span className="ml-2">Created by: {owner}</span>
                        </p>

                        {/* View Lesson button */}
                        <Link
                          to={`/instructor-lessons-content/${lesson._id}`}
                          state={{ lesson, backTo: "/student-lessons" }}
                          className="mt-3 block w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white text-center shadow-sm hover:bg-teal-700 transition-colors duration-200"
                        >
                          View Lesson
                        </Link>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
