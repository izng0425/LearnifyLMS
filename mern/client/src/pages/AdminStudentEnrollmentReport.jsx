// src/pages/AdminStudentEnrollmentReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon, ReportIcon } from "../components/Icons";

// Admin navigation (kept consistent with your other admin pages)
const adminMenu = [
  { path: "/admin-lessons", label: "Lessons", icon: BookIcon },
  { path: "/admin-course", label: "Courses", icon: CourseIcon },
  { path: "/admin-classroom", label: "Classroom", icon: ClassroomIcon },
  { path: "/admin-student-list", label: "Student List", icon: UsersIcon },
  { path: "/admin-instructor-list", label: "Instructor List", icon: UsersIcon },
  { path: "/admin-student-enrollment-report", label: "Enrollment Report", icon: ReportIcon },
];

export default function AdminStudentEnrollmentReport() {
  // Remote data
  const [courses, setCourses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [progressList, setProgressList] = useState([]); // for completion %
  const [grades, setGrades] = useState([]);             // for average grade

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  useEffect(() => {
    // Fetch everything in parallel. Each request is optional-safe.
    async function loadAll() {
      setLoading(true);
      setError("");

      const getJson = async (url) => {
        try {
          const res = await fetch(url, { headers: authHeaders });
          if (!res.ok) throw new Error(`GET ${url} failed`);
          return await res.json();
        } catch (e) {
          console.warn(e.message);
          return null;
        }
      };

      const [cRes, rRes, sRes, pRes, gRes] = await Promise.all([
        getJson("http://localhost:5050/courses"),
        getJson("http://localhost:5050/classrooms"),
        getJson("http://localhost:5050/api/students"),
        getJson("http://localhost:5050/progress"),
        getJson("http://localhost:5050/grades"),
      ]);

      if (!cRes && !rRes && !sRes && !pRes && !gRes) {
        setError("Failed to load report data.");
      }

      setCourses(Array.isArray(cRes) ? cRes : []);
      setClassrooms(Array.isArray(rRes) ? rRes : []);
      setStudents(Array.isArray(sRes) ? sRes : []);
      setProgressList(Array.isArray(pRes) ? pRes : []);
      setGrades(Array.isArray(gRes) ? gRes : []);

      setLoading(false);
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Helpers ----------
  const fmtPct = (v) => (Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : "—");
  const byId = (x) =>
    typeof x === "string"
      ? x.replace(/^ObjectId\("?(.*?)"?\)$/, "$1")
      : String(x || "");

  // Build enrollment per course (used only to compute average)
  const enrollmentsByCourse = useMemo(() => {
    const map = new Map(); // courseId -> count
    courses.forEach((c) => map.set(byId(c._id), 0));

    students.forEach((s) => {
      const c =
        (s.course && (s.course._id || s.course.id || s.course)) || s.courseId;
      if (!c) return;
      const key = byId(c);
      map.set(key, (map.get(key) || 0) + 1);
    });

    return courses.map((c) => {
      const key = byId(c._id);
      return {
        id: key,
        count: map.get(key) || 0,
      };
    });
  }, [courses, students]);

  const avgStudentsPerCourse = useMemo(() => {
    if (!enrollmentsByCourse.length) return undefined;
    const total = enrollmentsByCourse.reduce((s, x) => s + x.count, 0);
    return total / enrollmentsByCourse.length;
  }, [enrollmentsByCourse]);

  // Build enrollment per classroom (used only to compute average)
  const enrollmentsByClassroom = useMemo(() => {
    return classrooms.map((room) => {
      const count = Array.isArray(room.students)
        ? room.students.length
        : typeof room.numStudents === "number"
        ? room.numStudents
        : 0;
      return { id: byId(room._id), count };
    });
  }, [classrooms]);

  const avgStudentsPerClassroom = useMemo(() => {
    if (!enrollmentsByClassroom.length) return undefined;
    const total = enrollmentsByClassroom.reduce((s, x) => s + x.count, 0);
    return total / enrollmentsByClassroom.length;
  }, [enrollmentsByClassroom]);

  // Completion %
  const completion = useMemo(() => {
    if (!progressList.length) return { completedPct: undefined, notCompletedPct: undefined };

    let total = 0;
    let completed = 0;

    progressList.forEach((p) => {
      total += 1;
      const isDone =
        p.isCompleted === true ||
        (typeof p.progress === "number" && p.progress >= 100) ||
        String(p.status || "").toLowerCase() === "completed";
      if (isDone) completed += 1;
    });

    if (total === 0) return { completedPct: undefined, notCompletedPct: undefined };
    const completedPct = completed / total;
    return { completedPct, notCompletedPct: 1 - completedPct };
  }, [progressList]);

  // Average grade
  const averageGrade = useMemo(() => {
    const vals = grades
      .map((g) => {
        if (typeof g.score === "number") return g.score;
        if (typeof g.grade === "number") return g.grade;
        if (typeof g.percentage === "number") return g.percentage;
        return undefined;
      })
      .filter((x) => Number.isFinite(x));

    if (!vals.length) return undefined;
    const sum = vals.reduce((s, x) => s + x, 0);
    return sum / vals.length;
  }, [grades]);

  // ---------- UI ----------
  return (
    <div className="flex">
      <Sidebar items={adminMenu} />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Student Enrollment Report
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="mt-4 text-gray-500">Loading report…</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {!loading && !error && (
          <>
            {/* KPI cards only (breakdown lists removed) */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-teal-800">
                  Avg students / course
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-800">
                  {avgStudentsPerCourse !== undefined
                    ? avgStudentsPerCourse.toFixed(1)
                    : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-teal-800">
                  Avg students / classroom
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-800">
                  {avgStudentsPerClassroom !== undefined
                    ? avgStudentsPerClassroom.toFixed(1)
                    : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-teal-800">
                  Courses completed (%)
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-800">
                  {fmtPct(completion.completedPct)}
                </div>
              </div>

              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-teal-800">
                  Courses not completed (%)
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-800">
                  {fmtPct(completion.notCompletedPct)}
                </div>
              </div>

              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-4">
                <div className="text-sm font-semibold text-teal-800">
                  Average grade
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-800">
                  {averageGrade !== undefined ? averageGrade.toFixed(1) : "—"}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  *Assumes numeric fields like <code>score</code>,{" "}
                  <code>grade</code>, or <code>percentage</code> in /grades.
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
