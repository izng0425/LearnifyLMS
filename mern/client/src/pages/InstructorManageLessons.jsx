// src/pages/InstructorManageLessons.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon, PersonIcon } from "../components/Icons";

/**
 * InstructorManageLessons
 */
export default function InstructorManageLessons() {
  // Instructor sidebar (consistent with your instructor pages)
  const instructorMenu = [
    { path: "/instructor-lessons", label: "Lessons", icon: BookIcon },
    { path: "/instructor-courses", label: "Courses", icon: CourseIcon },
    { path: "/instructor-classroom", label: "Classroom", icon: ClassroomIcon },
    { path: "/instructor-student-list", label: "Student List", icon: UsersIcon },
    { path: "/instructor-manage-courses", label: "Manage Courses", icon: CourseIcon },
    { path: "/instructor-manage-lessons", label: "Manage Lessons", icon: BookIcon }, // ← this page
    { path: "/instructor-manage-classroom", label: "Manage Classroom", icon: ClassroomIcon }, // ← this page
  ];

  // UI state
  const [activeTab, setActiveTab] = useState("lessonsList"); // "lessonsList" | "summary"
  const [allLessons, setAllLessons] = useState([]);
  const [scopedLessons, setScopedLessons] = useState([]); // only my lessons
  const [allProgress, setAllProgress] = useState([]);
  const [scopedProgress, setScopedProgress] = useState([]); // only progress for my lessons
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- Auth helpers ---------------------------------------------------------

  // Safely decode JWT from sessionStorage (same storage your other instructor pages use)
  function getMeFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // Pick a few identifiers we can match against createdBy
      return {
        id: payload.id || payload._id || payload.userId || null,
        email: payload.email || null,
        username: payload.username || null,
      };
    } catch {
      return null;
    }
  }

  // Check if a lesson belongs to the instructor (createdBy may be string or object)
  function isCreatedByMe(createdBy, me) {
    if (!me) return false;
    if (!createdBy) return false;

    // Normalize inputs
    const cid = typeof createdBy === "object" ? createdBy._id : createdBy;
    const cemail = typeof createdBy === "object" ? createdBy.email : createdBy;
    const cuser = typeof createdBy === "object" ? createdBy.username : createdBy;

    const norm = (v) => (v ? String(v).toLowerCase() : "");
    const eq = (a, b) => norm(a) && norm(a) === norm(b);

    // Match id/email/username against either raw string or object fields
    return (
      eq(cid, me.id) ||
      eq(cemail, me.email) ||
      eq(cuser, me.username) ||
      // Some APIs store createdBy as the email/username string directly
      eq(createdBy, me.email) ||
      eq(createdBy, me.username) ||
      eq(createdBy, me.id)
    );
  }

  const me = getMeFromToken();

  // ---- Fetch data -----------------------------------------------------------
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
        const lessonsArray = Array.isArray(lData) ? lData : [];
        setAllLessons(lessonsArray);

        // Scope lessons to "me" if we know who "me" is; otherwise show all (failsafe)
        const onlyMine = me
          ? lessonsArray.filter((l) => isCreatedByMe(l.createdBy, me))
          : lessonsArray;
        setScopedLessons(onlyMine);

        if (pRes.ok) {
          const pData = await pRes.json();
          const progressArray = Array.isArray(pData) ? pData : [];
          setAllProgress(progressArray);

          // Filter progress to my lessons
          const myLessonIds = new Set(
            onlyMine.map((l) => normalizeId(l._id || l.id || l.lessonId))
          );
          setScopedProgress(
            progressArray.filter((p) => {
              const pid =
                normalizeId(p.lessonId) ||
                normalizeId(p.lesson?._id || p.lesson?.id || p.lesson);
              return pid && myLessonIds.has(pid);
            })
          );
        } else {
          setAllProgress([]);
          setScopedProgress([]);
        }
      } catch (e) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Helpers --------------------------------------------------------------
  function normalizeId(x) {
    if (!x) return "";
    const s = typeof x === "string" ? x : String(x);
    return s.replace(/^ObjectId\("?(.*?)"?\)$/, "$1");
  }

  function statusOf(l) {
    const s = typeof l.status === "string" ? l.status.toLowerCase() : "";
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    if (s === "draft") return "Draft";
    if (l.isArchived || l.archived) return "Archived";
    if (l.isPublished || l.published) return "Published";
    return "Draft";
  }

  function creditOf(l) {
    const cp =
      l.creditPoints ??
      l.totalCredit ??
      (typeof l.estimatedWork === "number" ? l.estimatedWork : undefined);
    return Number.isFinite(cp) ? Number(cp) : undefined;
  }

  const fmtPct = (v) => (Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : "—");

  // Build per-lesson completion map from scoped progress
  const perLessonCompletion = useMemo(() => {
    const map = new Map();
    scopedProgress.forEach((p) => {
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
  }, [scopedProgress]);

  // AC1 & AC4: overall completion / not-completion for my lessons
  const overallCompletion = useMemo(() => {
    let total = 0;
    let completed = 0;

    scopedProgress.forEach((p) => {
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
  }, [scopedProgress]);

  // AC2: counts by status (my lessons only)
  const statusCounts = useMemo(() => {
    const counts = { Draft: 0, Published: 0, Archived: 0 };
    scopedLessons.forEach((l) => {
      const s = statusOf(l);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [scopedLessons]);

  // AC3: average credit points (my lessons only)
  const avgCredit = useMemo(() => {
    const values = scopedLessons.map(creditOf).filter((v) => Number.isFinite(v));
    if (!values.length) return undefined;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }, [scopedLessons]);

  // Row progress helper
  const rowProgress = (lesson) => {
    const id = normalizeId(lesson._id || lesson.id || lesson.lessonId);
    const stat = perLessonCompletion.get(id);
    if (!stat || stat.total === 0) return { pct: 0 };
    return { pct: stat.completed / stat.total };
  };

  // ---- Render ---------------------------------------------------------------
  return (
    <div className="flex">
      <Sidebar items={instructorMenu} />

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
            { key: "summary", label: "Summary" }, // US20 KPIs
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

        {/* Total count (scoped) */}
        <div className="mb-6 text-right text-sm font-medium text-gray-800">
          Total Lessons: <span className="font-bold">{scopedLessons.length}</span>
        </div>

        {/* Lessons table (scoped) */}
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
                      <th className="px-4 py-3 text-left  text-sm font-semibold text-slate-700">Lesson</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Credit Points</th>
                      {/* <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Completed</th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {scopedLessons.map((l) => {
                      const status = statusOf(l);
                      const credit = creditOf(l);
                      const rp = rowProgress(l);

                      return (
                        <tr key={l._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{l.title || "Untitled lesson"}</td>

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
                                  {(rp.pct * 100).toFixed(0)}%
                                </span>
                                <span className="text-red-600 font-medium">
                                  {((1 - rp.pct) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${rp.pct * 100}%` }}
                                />
                              </div>
                            </div>
                          </td> */}
                        </tr>
                      );
                    })}
                    {scopedLessons.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No lessons found for your account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Summary (US20 KPIs) */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {/* AC1 */}
            {/* <KPIBlock
              title="Total Lessons Completed (%)"
              value={fmtPct(overallCompletion.completedPct)} */}
            {/* /> */}
            {/* AC4 */}
            {/* <KPIBlock
              title="Total Lessons Not Completed (%)"
              value={fmtPct(overallCompletion.notCompletedPct)}
            /> */}
            {/* AC3 */}
            <KPIBlock
              title="Average Credit Points per Lesson"
              value={avgCredit !== undefined ? avgCredit.toFixed(2) : "—"}
            />
            {/* AC2 */}
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
