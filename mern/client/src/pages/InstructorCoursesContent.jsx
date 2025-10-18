// src/pages/InstructorCoursesContent.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function InstructorCoursesContent() {
  const { state } = useLocation();
  const course = state?.course;
  const backHref = state?.backTo || "/instructor-courses";

  // Resolve lesson titles when only ids are provided
  const [resolvedLessons, setResolvedLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // Guard: opened directly without state
  if (!course) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">Course details</h1>
          <Link
            to={backHref}
            className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
          >
            ← Back
          </Link>
        </div>
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No course data was provided. Open this page from the Courses list.
        </div>
      </main>
    );
  }

  // Normalize owner for display
  const owner =
    course.ownerName ??
    (typeof course.owner === "object"
      ? course.owner?.name || course.owner?.email || course.owner?.username
      : course.owner) ??
    (typeof course.createdBy === "object"
      ? course.createdBy?.name || course.createdBy?.email || course.createdBy?.username
      : course.createdBy) ??
    "—";

  // Display id (raw or stringified)
  const displayId =
    course.courseId ||
    (typeof course._id === "string" ? course._id : (course._id && String(course._id)) || "—");

  // Helpers for lessons
  const cleanObjectId = (val) => String(val || "").replace(/^ObjectId\("?(.*?)"?\)$/, "$1");
  const shortId = (val) => {
    const s = cleanObjectId(val);
    return s.length > 8 ? s.slice(-8) : s || "—";
  };

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

  useEffect(() => {
    const run = async () => {
      if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
        setResolvedLessons([]);
        return;
      }
      const cache = new Map();
      const toFetch = [];

      for (const entry of course.lessons) {
        if (typeof entry === "string") {
          const id = cleanObjectId(entry);
          if (id) toFetch.push(id);
        } else if (entry && typeof entry === "object") {
          const id = cleanObjectId(entry._id || entry.lessonId);
          if (entry.title) cache.set(id || entry.title, { ...entry, _id: id || entry._id });
          else if (id) toFetch.push(id);
        }
      }

      if (toFetch.length === 0) {
        setResolvedLessons(Array.from(cache.values()));
        return;
      }

      setLessonsLoading(true);
      const token = sessionStorage.getItem("token");
      try {
        const results = await Promise.all(
          toFetch.map(async (id) => {
            try {
              const res = await fetch(`http://localhost:5050/lessons/${id}`, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error("fetch fail");
              return await res.json();
            } catch {
              return { _id: id, title: null };
            }
          })
        );
        for (const item of results) {
          const id = cleanObjectId(item?._id || item?.lessonId);
          cache.set(id || shortId(id), item);
        }
        setResolvedLessons(Array.from(cache.values()));
      } finally {
        setLessonsLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const lessonDisplay = (l) => {
    const id = cleanObjectId(l?._id || l?.lessonId || l);
    const name =
      (l && typeof l === "object" && (l.title || l.name)) ||
      (resolvedLessons.find((x) => cleanObjectId(x._id || x.lessonId) === id)?.title ?? null);
    return { id, title: name || `Lesson ${shortId(id)}` };
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header: only title + Back */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-teal-800">{course.title}</h1>
        <Link
          to={backHref}
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </Link>
      </div>

      {/* Main card */}
      <section className="mt-6 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
        {/* Each piece as its own section like Description/Lessons */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">ID</h2>
          <p className="mt-2 text-slate-700 break-all">{displayId}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Status</h2>
          <p className="mt-2 text-slate-700">{course.status || "—"}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Total credits</h2>
          <p className="mt-2 text-slate-700">{course.totalCredit ?? 0}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Owner</h2>
          <p className="mt-2 text-slate-700">{owner}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Created</h2>
          <p className="mt-2 text-slate-700">{formatDate(course.createdAt)}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Last updated</h2>
          <p className="mt-2 text-slate-700">{formatDate(course.updatedAt)}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        {/* Description */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Description</h2>
          <p className="mt-2 text-slate-700">{course.description || "—"}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        {/* Lessons */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Lessons</h2>
          {Array.isArray(course.lessons) && course.lessons.length > 0 ? (
            <>
              {lessonsLoading && <p className="mt-2 text-slate-500">Loading lessons…</p>}
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {(resolvedLessons.length > 0 ? resolvedLessons : course.lessons).filter((item) => {
                    // Check if lesson is an object and has status === "Published"
                    const lesson = typeof item === "object" ? item : null;
                    return lesson?.status === "Published";
                  }).map((item, i) => {
                  const disp = lessonDisplay(item);
                  return (
                    <li key={disp.id || i}>
                      <Link
                        to={`/instructor-lessons-content/${disp.id || ""}`}
                        state={
                          typeof item === "object"
                            ? { lesson: item, backTo: backHref }
                            : { backTo: backHref }
                        }
                        className="hover:underline"
                      >
                        {disp.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-slate-700">None</p>
          )}
        </div>
      </section>
    </main>
  );
}
