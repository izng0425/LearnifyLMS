// src/pages/InstructorLessonsContent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

export default function InstructorLessonsContent() {
  const { id } = useParams();
  const { state } = useLocation();

  // Prefer lesson from navigation state; otherwise fetch by :id
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

  // For resolving prerequisite labels when only ObjectId strings are stored
  const [allLessonsMap, setAllLessonsMap] = useState(new Map());

  // ---- Helpers ----
  const API_BASE = "http://localhost:5050";
  const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Normalize ObjectId("...") → "..."
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

  // Status display normalization
  const displayStatus = useMemo(() => {
    const s = String(lesson.status || "").toLowerCase();
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    return lesson.status || "—";
  }, [lesson.status]);

  // Owner normalization (ownerName -> createdBy.{name|email|username} -> createdBy string)
  const owner = useMemo(() => {
    if (lesson.ownerName) return lesson.ownerName;
    const cb = lesson.createdBy;
    if (cb && typeof cb === "object") {
      return cb.name || cb.email || cb.username || "—";
    }
    return cb || "—";
  }, [lesson.ownerName, lesson.createdBy]);

  // If we navigated without state.lesson, fetch the real lesson; also build map for prerequisites
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
          const map = new Map(list.map((x) => [cleanObjectId(x._id), x]));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Display ID: prefer human lessonId; fallback to _id; last resort :id
  const displayId = useMemo(
    () => lesson.lessonId || cleanObjectId(lesson._id) || id || "—",
    [lesson.lessonId, lesson._id, id]
  );

  // Estimated hours/week (handle multiple legacy field names)
  const estHoursNum = useMemo(() => {
    if (lesson.estimatedWork !== undefined && lesson.estimatedWork !== null)
      return Number(lesson.estimatedWork);
    if (lesson.hoursPerWeek !== undefined && lesson.hoursPerWeek !== null)
      return Number(lesson.hoursPerWeek);
    if (lesson.estimatedHoursPerWeek !== undefined && lesson.estimatedHoursPerWeek !== null)
      return Number(lesson.estimatedHoursPerWeek);
    return undefined;
  }, [lesson]);

  // Find a lesson by _id or by lessonId (fallback)
  const findLessonByAnyId = (val) => {
    if (!val) return null;
    const key = cleanObjectId(val);
    // exact _id match
    if (allLessonsMap.has(key)) return allLessonsMap.get(key);
    // fallback: scan lessonId
    for (const L of allLessonsMap.values()) {
      if (String(L.lessonId) === key) return L;
    }
    return null;
  };

  // Build linkable prerequisites: [{ id, title }]
  const prereqItems = useMemo(() => {
    const arr = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
    return arr
      .map((p) => {
        if (!p) return null;

        // String id (could be _id or lessonId)
        if (typeof p === "string") {
          const L = findLessonByAnyId(p);
          const pid = cleanObjectId(L?._id || p);
          const title =
            (L?.lessonId ? `${L.lessonId} – ${L?.title || ""}` : L?.title) ||
            `Lesson ${shortId(pid)}`;
          return { id: pid, title };
        }

        // Populated object
        if (typeof p === "object") {
          const L = findLessonByAnyId(p._id || p.lessonId);
          const pid = cleanObjectId(L?._id || p._id || p.lessonId);
          const title =
            p.title ||
            (L?.lessonId ? `${L.lessonId} – ${L?.title || ""}` : L?.title) ||
            `Lesson ${shortId(pid)}`;
          return { id: pid, title };
        }
        return null;
      })
      .filter(Boolean);
  }, [lesson.prerequisites, allLessonsMap]);

  // 👇 Back のデフォルトを student 側へ
  const backHref = state?.backTo || "/student-lessons";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header: airy — only title + Back */}
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

      {/* Single card with each field as its own block */}
      <section className="mt-6 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
        {/* Lesson ID */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Lesson ID</h2>
          <p className="mt-2 text-slate-700 break-all">{displayId}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        {/* Status */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Status</h2>
          <p className="mt-2 text-slate-700">{displayStatus}</p>
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
          <p className="mt-2 text-slate-700">{owner}</p>
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
          {Array.isArray(lesson.readings) && lesson.readings.length ? (
            <ul className="mt-2 list-disc pl-5">
              {lesson.readings.map((r, i) => {
                // allow both string and object {title,url}
                const title = typeof r === "string" ? r : r?.title;
                const url = typeof r === "object" ? r?.url : undefined;
                return (
                  <li key={i}>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:underline"
                      >
                        {title || url}
                      </a>
                    ) : (
                      <span className="text-slate-700">
                        {title || "Untitled"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-slate-700">—</p>
          )}
        </div>

        <div className="my-6 border-t border-teal-100" />

        {/* Assignments */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Assignments</h2>
          {Array.isArray(lesson.assignments) && lesson.assignments.length ? (
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

        {/* Prerequisites (link to this Instructor page) */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Prerequisites</h2>
          {prereqItems.length ? (
            <ul className="mt-2 list-disc pl-5">
              {prereqItems.map(({ id: pid, title }, idx) => (
                <li key={pid || idx}>
                  {pid ? (
                    <Link
                      to={`/instructor-lessons-content/${pid}`}
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

      {/* bottom Back is intentionally omitted to keep the header clean-only */}
    </main>
  );
}
