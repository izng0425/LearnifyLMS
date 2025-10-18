// src/pages/StudentCoursesContent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

export default function StudentCoursesContent() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  // Course state
  const [course, setCourse] = useState(
    state?.course || {
      _id: "",
      courseId: "",
      title: "Course",
      createdBy: "—",
      ownerName: "",
      status: "Draft",
      totalCredit: undefined,
      createdAt: null,
      updatedAt: null,
      description: "",
      syllabus: "",
      lessons: [],
    }
  );

  const [allLessonsMap, setAllLessonsMap] = useState(new Map());
  const [grades, setGrades] = useState([]); // ✅ new

  // ---- Helpers ----
  const API_BASE = "http://localhost:5050";
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const userId =
    typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

  const cleanObjectId = (val) =>
    String(val || "").replace(/^ObjectId\("?(.*?)"?\)$/, "$1");

  const shortId = (val) => {
    const s = cleanObjectId(val);
    return s.length > 8 ? s.slice(-8) : s || "—";
  };

  const displayId = useMemo(() => {
    const raw = course.courseId || course._id || searchParams.get("id") || "";
    return course.courseId || shortId(raw);
  }, [course.courseId, course._id, searchParams]);

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

  // Resolve lessons into linkable items
  const lessonItems = useMemo(() => {
    const arr = Array.isArray(course.lessons) ? course.lessons : [];
    return arr
      .map((p) => {
        if (!p) return null;
        if (typeof p === "string") {
          const L = allLessonsMap.get(cleanObjectId(p));
          const id = cleanObjectId(L?._id || p);
          const title =
            (L?.lessonId ? `${L.lessonId} – ${L?.title || ""}` : L?.title) ||
            `Lesson ${shortId(id)}`;
          return { id, title };
        }
        if (typeof p === "object") {
          const key = cleanObjectId(p._id || p.id);
          const L = allLessonsMap.get(key) || p;
          const id = cleanObjectId(L?._id || key);
          const title =
            (L?.lessonId ? `${L.lessonId} – ${L?.title || ""}` : L?.title) ||
            `Lesson ${shortId(id)}`;
          return { id, title };
        }
        return null;
      })
      .filter(Boolean);
  }, [course.lessons, allLessonsMap]);

  const backHref = state?.backTo || "/student-course";

  // Fetch course and lessons
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let current = state?.course;
        const qid = searchParams.get("id");
        if (!current && qid) {
          const res = await fetch(`${API_BASE}/courses/${qid}`, {
            headers: { "Content-Type": "application/json", ...authHeaders },
          });
          if (res.ok) current = await res.json();
        }
        if (!cancelled && current) setCourse(current);

        const resAllLessons = await fetch(`${API_BASE}/lessons`, {
          headers: { "Content-Type": "application/json", ...authHeaders },
        });
        if (resAllLessons.ok) {
          const list = await resAllLessons.json();
          const map = new Map(list.map((x) => [cleanObjectId(x._id), x]));
          if (!cancelled) setAllLessonsMap(map);
        }
      } catch (e) {
        console.error("Error loading course/lessons:", e);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fetch student’s grades for this classroom
  useEffect(() => {
    const loadGrades = async () => {
      if (!course.classroomId) return;
      try {
        const res = await fetch(
          `${API_BASE}/grades?classroomId=${course.classroomId}`,
          { headers: { "Content-Type": "application/json", ...authHeaders } }
        );
        if (res.ok) {
          const list = await res.json();
          if (userId) {
            setGrades(list.filter((g) => cleanObjectId(g.studentId) === userId));
          }
        }
      } catch (err) {
        console.error("Error fetching grades:", err);
      }
    };
    loadGrades();
  }, [course.classroomId, userId]);

  const creditPoints = course.totalCredit ?? course.creditPoints;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-teal-800">
          {course.title || "Course"}
        </h1>
        <Link
          to={backHref}
          className="rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-700 hover:bg-teal-50"
        >
          ← Back
        </Link>
      </div>

      {/* Info card */}
      <section className="mt-6 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-teal-800">Course ID</h2>
          <p className="mt-2 text-slate-700 break-all">{displayId}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Status</h2>
          <p className="mt-2 text-slate-700">{getStatus(course)}</p>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Instructor</h2>
          <p className="mt-2 text-slate-700">{ownerOf(course)}</p>
        </div>

        {creditPoints !== undefined && (
          <>
            <div className="my-6 border-t border-teal-100" />
            <div>
              <h2 className="text-sm font-semibold text-teal-800">
                Credit Points
              </h2>
              <p className="mt-2 text-slate-700">{creditPoints}</p>
            </div>
          </>
        )}

        <div className="my-6 border-t border-teal-100" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-teal-800">Created</h2>
            <p className="mt-2 text-slate-700">{formatDate(course.createdAt)}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-teal-800">
              Last updated
            </h2>
            <p className="mt-2 text-slate-700">{formatDate(course.updatedAt)}</p>
          </div>
        </div>

        <div className="my-6 border-t border-teal-100" />

        <div>
          <h2 className="text-sm font-semibold text-teal-800">Description</h2>
          <p className="mt-2 text-slate-700 whitespace-pre-wrap">
            {course.description || "—"}
          </p>
        </div>

        {course.syllabus && (
          <>
            <div className="my-6 border-t border-teal-100" />
            <div>
              <h2 className="text-sm font-semibold text-teal-800">Syllabus</h2>
              <p className="mt-2 text-slate-700 whitespace-pre-wrap">
                {course.syllabus}
              </p>
            </div>
          </>
        )}

        {/* ✅ Lessons + Grades */}
        {lessonItems.length > 0 && (
          <>
            <div className="my-6 border-t border-teal-100" />
            <div>
              <h2 className="text-sm font-semibold text-teal-800">Lessons</h2>
              <ul className="mt-2 list-disc pl-5">
                {lessonItems.map(({ id, title }, idx) => {
                  const gradeObj = grades.find(
                    (g) => cleanObjectId(g.lessonId) === id
                  );
                  return (
                    <li key={idx}>
                      <span className="text-slate-700">{title}</span>
                      {gradeObj ? (
                        <span className="ml-2 text-sm">
                          Grade: {gradeObj.grade}% —{" "}
                          {gradeObj.grade >= 50 ? (
                            <span className="text-green-600 font-medium">
                              Pass
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Fail
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="ml-2 text-sm text-gray-500">
                          Not graded
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
