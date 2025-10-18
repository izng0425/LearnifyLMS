// src/pages/AdminLessonsContent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

export default function AdminLessonsContent() {
  const { id } = useParams();
  const { state } = useLocation();

  const [lesson, setLesson] = useState(
    state?.lesson || {
      _id: id,
      lessonId: "",
      title: "Lesson",
      createdBy: "—",
      status: "Draft",
      creditPoints: 0,
      createdAt: null,
      updatedAt: null,
      description: "",
      objective: "",
      prerequisites: [],
      readings: [],
      assignments: [],
      estimatedWork: undefined,
    }
  );

  const [allLessonsMap, setAllLessonsMap] = useState(new Map());

  const cleanObjectId = (val) =>
    String(val || "").replace(/^ObjectId\("?(.*?)"?\)$/, "$1");

  const shortId = (val) => {
    const s = cleanObjectId(val);
    return s.length > 8 ? s.slice(-8) : s || "—";
  };

  const findLessonByAnyId = (val) => {
    if (!val) return null;
    const key = cleanObjectId(val);
    if (allLessonsMap.has(key)) return allLessonsMap.get(key);
    for (const L of allLessonsMap.values()) {
      if (String(L.lessonId) === key) return L;
    }
    return null;
  };

  const API_BASE = "http://localhost:5050";
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

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
    let cancelled = false;

    async function fetchLessonAndAll() {
      try {
        let current = state?.lesson;

        if (!current && id) {
          const res = await fetch(`${API_BASE}/lessons/${id}`, {
            headers: { "Content-Type": "application/json", ...authHeaders },
          });
          if (res.ok) current = await res.json();
        }

        if (!cancelled && current) setLesson(current);

        const resAll = await fetch(`${API_BASE}/lessons`, {
          headers: { "Content-Type": "application/json", ...authHeaders },
        });
        if (resAll.ok) {
          const list = await resAll.json();
          const map = new Map(list.map((x) => [x._id, x]));
          if (!cancelled) setAllLessonsMap(map);
        }
      } catch (e) {
        console.error("Error loading lesson or all-lessons map:", e);
      }
    }

    fetchLessonAndAll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayId = useMemo(
    () => lesson.lessonId || lesson._id || id || "—",
    [lesson.lessonId, lesson._id, id]
  );

  const estHoursNum = useMemo(() => {
    if (lesson.estimatedWork !== undefined && lesson.estimatedWork !== null)
      return Number(lesson.estimatedWork);
    if (lesson.hoursPerWeek !== undefined && lesson.hoursPerWeek !== null)
      return Number(lesson.hoursPerWeek);
    if (
      lesson.estimatedHoursPerWeek !== undefined &&
      lesson.estimatedHoursPerWeek !== null
    )
      return Number(lesson.estimatedHoursPerWeek);
    return undefined;
  }, [lesson]);

  const prereqItems = useMemo(() => {
    const arr = Array.isArray(lesson.prerequisites)
      ? lesson.prerequisites
      : [];
    return arr
      .map((p) => {
        if (!p) return null;
        if (typeof p === "string") {
          const L = findLessonByAnyId(p);
          const id = cleanObjectId(L?._id || p);
          const title =
            (L?.lessonId ? `${L.lessonId} – ${L?.title || ""}` : L?.title) ||
            `Lesson ${shortId(id)}`;
          return { id, title };
        }
        if (typeof p === "object") {
          const L = findLessonByAnyId(p._id || p.lessonId);
          const id = cleanObjectId(L?._id || p._id || p.lessonId);
          const title =
            p.title ||
            (L?.lessonId ? `${L.lessonId} – ${L?.title || ""}` : L?.title) ||
            `Lesson ${shortId(id)}`;
          return { id, title };
        }
        return null;
      })
      .filter(Boolean);
  }, [lesson.prerequisites, allLessonsMap]);

  // Admin-specific back route
  const backHref = state?.backTo || "/admin-lessons";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-teal-800">
          {lesson.title || "Lesson"}
        </h1>
        <Link
          to={backHref}
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </Link>
      </div>

      <section className="mt-6 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
        {/* same body as instructor, unchanged */}
        {/* Lesson ID */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Lesson ID</h2>
          <p className="mt-2 text-slate-700 break-all">{displayId}</p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Status */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Status</h2>
          <p className="mt-2 text-slate-700">{lesson.status || "—"}</p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Credits */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Credits</h2>
          <p className="mt-2 text-slate-700">{lesson.creditPoints ?? 0}</p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Estimated workload */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Estimated workload</h2>
          <p className="mt-2 text-slate-700">
            {estHoursNum !== undefined ? `${estHoursNum}h / week` : "—"}
          </p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Owner */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Owner</h2>
          <p className="mt-2 text-slate-700">{lesson.createdBy || "—"}</p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Created */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Created</h2>
          <p className="mt-2 text-slate-700">{formatDate(lesson.createdAt)}</p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Last updated */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Last updated</h2>
          <p className="mt-2 text-slate-700">{formatDate(lesson.updatedAt)}</p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Description */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Description</h2>
          <p className="mt-2 text-slate-700 whitespace-pre-wrap">
            {lesson.description || "—"}
          </p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Objective */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Objective</h2>
          <p className="mt-2 text-slate-700 whitespace-pre-wrap">
            {lesson.objective || "—"}
          </p>
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Reading list */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Reading list</h2>
          {lesson.readings?.length ? (
            <ul className="mt-2 list-disc pl-5">
              {lesson.readings.map((r, i) => (
                <li key={i}>
                  {r?.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline"
                    >
                      {r.title || r.url}
                    </a>
                  ) : (
                    <span className="text-slate-700">
                      {r?.title || "Untitled"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-700">—</p>
          )}
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Assignments */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Assignments</h2>
          {lesson.assignments?.length ? (
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              {lesson.assignments.map((a, i) => (
                <li key={i}>{a?.title || "Untitled assignment"}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-700">—</p>
          )}
        </div>
        <div className="my-6 border-t border-teal-100" />

        {/* Prerequisites */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Prerequisites</h2>
          {prereqItems.length ? (
            <ul className="mt-2 list-disc pl-5">
              {prereqItems.map(({ id, title }, idx) => (
                <li key={id || idx}>
                  {id ? (
                    <Link
                      to={`/admin-lessons-content/${id}`}
                      state={{ backTo: backHref }}
                      className="text-teal-700 hover:underline"
                    >
                      {title}
                    </Link>
                  ) : (
                    <span className="text-slate-700">{title}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-700">None</p>
          )}
        </div>
      </section>
    </main>
  );
}
