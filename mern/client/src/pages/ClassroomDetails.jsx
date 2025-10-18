import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useLocation } from "react-router-dom";


export default function ClassroomDetails() {
  const { id } = useParams(); // classroomId from route
  const { state } = useLocation();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:5050";
  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Date formatter
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  // Normalized status
  const displayStatus = useMemo(() => {
    const s = String(classroom?.status || "").toLowerCase();
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    return classroom?.status || "—";
  }, [classroom?.status]);

  useEffect(() => {
    let cancelled = false;

    async function fetchClassroom() {
      try {
        const res = await fetch(`${API_BASE}/classrooms/${id}`, {
          headers: { "Content-Type": "application/json", ...authHeaders },
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setClassroom(data);
        }
      } catch (err) {
        console.error("❌ Error fetching classroom:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchClassroom();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading classroom…</div>;
  if (!classroom) return <div className="p-6 text-red-500">Classroom not found</div>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-teal-800">
          {classroom.title}
        </h1>
        <Link
          to={state?.backTo || "/student-classrooms"}
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </Link>
      </div>

      {/* Card */}
      <section className="mt-6 rounded-xl border border-teal-200 bg-white p-6 shadow-sm space-y-6">
        {/* Classroom ID */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Classroom ID</h2>
          <p className="mt-1 text-slate-700 break-all">{classroom.classroomId}</p>
        </div>

        {/* Status */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Status</h2>
          <p className="mt-1 text-slate-700">{displayStatus}</p>
        </div>

        {/* Owner */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Owner</h2>
          <p className="mt-1 text-slate-700">{classroom.owner}</p>
        </div>

        {/* Linked course */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Course</h2>
          <p className="mt-1 text-slate-700">
            {Array.isArray(classroom.courses) && classroom.courses.length
              ? classroom.courses.map((c) => c.title || c._id).join(", ")
              : "—"}
          </p>
        </div>

        {/* Lessons */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Lessons</h2>
          {Array.isArray(classroom.lessons) && classroom.lessons.length ? (
            <ul className="mt-1 list-disc pl-5 space-y-1 text-slate-700">
              {classroom.lessons.map((l) => (
                <li key={l._id || l}>{l.title || l.lessonId || String(l)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">No lessons assigned</p>
          )}
        </div>

        {/* Students */}
        <div className="grid gap-1">
        <h2 className="text-sm font-medium text-teal-800">Students</h2>
        <div className="rounded-md border border-teal-200 px-3 py-2 max-h-48 overflow-auto">
            {Array.isArray(classroom.students) && classroom.students.length > 0 ? (
            <ul className="space-y-2">
                {classroom.students.map((s) => {
                const idVal = String(s._id || s);
                return (
                    <li key={idVal} className="flex items-center gap-2">
                    <span>
                        {s.firstName || s.lastName
                        ? `${s.firstName} ${s.lastName} (${s.username})`
                        : idVal}
                    </span>
                    </li>
                );
                })}
            </ul>
            ) : (
            <p className="text-sm text-slate-500">No students enrolled in this course</p>
            )}
        </div>
        </div>

        {/* Start time */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Start time</h2>
          <p className="mt-1 text-slate-700">{formatDate(classroom.startTime)}</p>
        </div>

        {/* Duration */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Duration</h2>
          <p className="mt-1 text-slate-700">{classroom.duration} minutes</p>
        </div>

        {/* Num students */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Number of students</h2>
          <p className="mt-1 text-slate-700">{classroom.numStudents}</p>
        </div>

        {/* Created + Updated */}
        <div className="text-sm text-slate-500">
          <p>Created: {formatDate(classroom.createdAt)}</p>
          <p>Last updated: {formatDate(classroom.updatedAt)}</p>
        </div>
      </section>
    </main>
  );
}
