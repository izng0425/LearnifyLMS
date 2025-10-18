// src/pages/AdminManageLessons.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

/**
 * AdminManageLessons
 * - Uses the same layout as AdminManageCourses.
 * - Shows a Lessons table and a Summary tab that fulfills US20 (AC1–AC4).
 */
export default function AdminManageLessons() {
  // Sidebar menu (keep consistent with your admin pages)
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

  const [activeTab, setActiveTab] = useState("lessonsList");
  const [lessons, setLessons] = useState([]);
  const [progressList, setProgressList] = useState([]); // for AC1 & AC4
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Fetch data ----------
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const [lRes, pRes] = await Promise.all([
          fetch("http://localhost:5050/lessons", { headers }),
          fetch("http://localhost:5050/progress", { headers }),
        ]);
        if (!lRes.ok) throw new Error("Failed to fetch lessons");
        const lData = await lRes.json();
        setLessons(Array.isArray(lData) ? lData : []);

        // progress is optional — if it fails we still show the page
        if (pRes.ok) {
          const pData = await pRes.json();
          setProgressList(Array.isArray(pData) ? pData : []);
        } else {
          setProgressList([]);
        }
      } catch (e) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Helpers ----------
  const normalizeId = (x) => {
    if (!x) return "";
    const s = typeof x === "string" ? x : String(x);
    return s.replace(/^ObjectId\("?(.*?)"?\)$/, "$1");
  };

  const statusOf = (l) => {
    const s = typeof l.status === "string" ? l.status.toLowerCase() : "";
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    if (l.isArchived || l.archived) return "Archived";
    if (l.isPublished || l.published) return "Published";
    return "Draft";
  };

  const creditOf = (l) => {
    const cp =
      l.creditPoints ??
      l.totalCredit ??
      (typeof l.estimatedWork === "number" ? l.estimatedWork : undefined);
    return Number.isFinite(cp) ? Number(cp) : undefined;
  };

  // Per-lesson completion from progress list
  const perLessonCompletion = useMemo(() => {
    // Map: lessonId -> { completed, total }
    const map = new Map();
    progressList.forEach((p) => {
      const id =
        normalizeId(p.lessonId) ||
        normalizeId(p.lesson?._id || p.lesson?.id || p.lesson);
      if (!id) return;
      const done =
        p.isCompleted === true ||
        (typeof p.progress === "number" && p.progress >= 100) ||
        String(p.status || "").toLowerCase() === "completed";
      const prev = map.get(id) || { completed: 0, total: 0 };
      map.set(id, {
        completed: prev.completed + (done ? 1 : 0),
        total: prev.total + 1,
      });
    });
    return map;
  }, [progressList]);

  // AC1 & AC4: overall completed / not completed (in %)
  const overallCompletion = useMemo(() => {
    let total = 0;
    let completed = 0;

    progressList.forEach((p) => {
      total += 1;
      const done =
        p.isCompleted === true ||
        (typeof p.progress === "number" && p.progress >= 100) ||
        String(p.status || "").toLowerCase() === "completed";
      if (done) completed += 1;
    });

    if (total === 0) return { completedPct: undefined, notCompletedPct: undefined };
    const completedPct = completed / total;
    return { completedPct, notCompletedPct: 1 - completedPct };
  }, [progressList]);

  // AC2: counts by status
  const statusCounts = useMemo(() => {
    const counts = { Draft: 0, Published: 0, Archived: 0 };
    lessons.forEach((l) => {
      const s = statusOf(l);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [lessons]);

  // AC3: average credit points per lesson
  const avgCredit = useMemo(() => {
    const values = lessons
      .map(creditOf)
      .filter((v) => Number.isFinite(v));
    if (!values.length) return undefined;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }, [lessons]);

  const fmtPct = (v) =>
    Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : "—";

  // Row progress (per lesson) – optional nice-to-have like the template
  const rowProgress = (lesson) => {
    const id = normalizeId(lesson._id || lesson.id || lesson.lessonId);
    const stat = perLessonCompletion.get(id);
    if (!stat || stat.total === 0) {
      return { completed: 0, notCompleted: 0, completedPct: 0 };
    }
    const pct = stat.completed / stat.total;
    return {
      completed: stat.completed,
      notCompleted: stat.total - stat.completed,
      completedPct: pct,
    };
  };

  return (
    <div className="flex">
      <Sidebar items={adminMenu} />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Manage Lessons
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { key: "lessonsList", label: "Lessons List" },
            { key: "summary", label: "Summary" }, // US20 KPIs live here
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Total count (like template) */}
        <div className="mb-6 text-right text-sm font-medium text-gray-800">
          Total Lessons: <span className="font-bold">{lessons.length}</span>
        </div>

        {/* Lessons table */}
        {activeTab === "lessonsList" && (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading lessons…</p>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-96 rounded-xl border border-teal-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Lesson</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Credit Points</th>
                      {/* <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Completed</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lessons.map((l) => {
                      const status = statusOf(l);
                      const credit = creditOf(l);
                      const rp = rowProgress(l);

                      return (
                        <tr key={l._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            {l.title || "Untitled lesson"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                status === "Published"
                                  ? "bg-green-100 text-green-800"
                                  : status === "Archived"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {Number.isFinite(credit) ? credit : "—"}
                          </td>
                          {/* <td className="px-4 py-3">
                            <div className="w-32 mx-auto">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-600 font-medium">
                                  {(rp.completedPct * 100).toFixed(0)}%
                                </span>
                                <span className="text-red-600 font-medium">
                                  {((1 - rp.completedPct) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${rp.completedPct * 100}%` }}
                                />
                              </div>
                            </div>
                          </td> */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Summary (US20 KPIs) */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {/* AC1: total lessons completed (%) */}
            {/* <KPIBlock
              title="Total Lessons Completed (%)"
              value={fmtPct(overallCompletion.completedPct)}
            /> */}
            {/* AC4: total lessons not completed (%) */}
            {/* <KPIBlock
              title="Total Lessons Not Completed (%)"
              value={fmtPct(overallCompletion.notCompletedPct)}
            /> */}
            {/* AC3: average credit points */}
            <KPIBlock
              title="Average Credit Points per Lesson"
              value={
                avgCredit !== undefined ? avgCredit.toFixed(2) : "—"
              }
            />

            {/* AC2: counts by status */}
            <StatBlock
              title="Lessons by Status"
              items={[
                { label: "Draft", value: statusCounts.Draft || 0 },
                { label: "Published", value: statusCounts.Published || 0 },
                { label: "Archived", value: statusCounts.Archived || 0 },
              ]}
            />
          </div>
        )}
      </main>
    </div>
  );
}

/** Small KPI card */
function KPIBlock({ title, value }) {
  const emphasize = title === "Average Credit Points per Lesson";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3
        className={`mb-2 ${
          emphasize
            ? "text-base font-bold text-gray-800"
            : "text-sm font-semibold text-gray-600"
        }`}
      >
        {title}
      </h3>
      <p className="text-2xl font-bold text-teal-700">{value}</p>
    </div>
  );
}

/** Status list card */
function StatBlock({ title, items }) {
  const emphasize = title === "Lessons by Status";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-1">
      <h3
        className={`mb-3 ${
          emphasize
            ? "text-base font-bold text-gray-800"
            : "text-sm font-semibold text-gray-600"
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.label} className="flex justify-between">
            <span className="text-gray-700">{x.label}</span>
            <span className="font-semibold text-gray-900">{x.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
