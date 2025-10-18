// src/pages/ViewClassroom.jsx
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

/**
 * InstructorViewClassroom
 */
export default function InstructorViewClassroom() {
  const location = useLocation();
  const { classroom } = location.state || {};

  // Left sidebar items
  const instructorMenu = [
    { path: "/instructor-lessons", label: "Lessons", icon: BookIcon },
    { path: "/instructor-courses", label: "Courses", icon: CourseIcon },
    { path: "/instructor-classroom", label: "Classroom", icon: ClassroomIcon },
    { path: "/instructor-student-list", label: "Student List", icon: UsersIcon },
    { path: "/instructor-manage-courses", label: "Manage Courses", icon: CourseIcon }, 
    { path: "/instructor-manage-lessons", label: "Manage Lessons", icon: BookIcon },
    { path: "/instructor-manage-classroom", label: "Manage Classroom", icon: ClassroomIcon }, // ← this page

  ];

  // UI state
  const [lessons, setLessons] = useState([]);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [openShelves, setOpenShelves] = useState({});
  const [grades, setGrades] = useState({}); // shape: { [lessonId]: { [studentId]: {score, passed, feedback, gradedAt} } }
  const [openMenuMemberId, setOpenMenuMemberId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingStates, setSavingStates] = useState({}); // optional per-row saving state
  const [popup, setPopup] = useState("");

  // Only classroom creator can edit
  const isCreator = classroom?.owner === sessionStorage.getItem("username");

  useEffect(() => {
    if (!classroom) {
      setError("No classroom data provided");
      setLoading(false);
      return;
    }
    fetchClassroomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroom]);

  // Small, auto-dismissing popup helper
  const showPopup = (msg) => {
    setPopup(msg);
    setTimeout(() => setPopup(""), 1200);
  };

  // Fetch lessons, members, then their grades
  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("token");

      // 1) Lessons that belong to this classroom
      const lessonsResponse = await fetch(
        `http://localhost:5050/lessons/classroom/${classroom._id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      if (!lessonsResponse.ok) throw new Error("Failed to fetch lessons");
      const lessonsData = await lessonsResponse.json();
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);

      // 2) Students enrolled
      const studentsResponse = await fetch(
        `http://localhost:5050/classrooms/${classroom._id}/students`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      if (!studentsResponse.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsResponse.json();
      setMembers(Array.isArray(studentsData) ? studentsData : []);

      // 3) Grades for those lessons/students
      await fetchGrades(lessonsData, studentsData, token);
    } catch (err) {
      console.error("Error fetching classroom data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build a nested map of grades for quick lookup/edit
  const fetchGrades = async (lessonsData, studentsData, token) => {
    try {
      // Initialize map with lesson keys
      const gradesMap = {};
      lessonsData.forEach((lesson) => {
        gradesMap[lesson._id] = {};
      });

      const res = await fetch(
        `http://localhost:5050/grades/${classroom._id}/grades`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      if (res.ok) {
        const allGrades = await res.json();

        // Quick existence map for valid students
        const studentExists = new Set(studentsData.map((s) => s._id));

        allGrades.forEach((g) => {
          const lessonId = g.lesson?._id || g.lessonId || g.lesson;
          const studentId = g.student?._id || g.studentId || g.student;
          if (gradesMap[lessonId] && studentExists.has(studentId)) {
            gradesMap[lessonId][studentId] = {
              score: typeof g.score === "number" ? g.score : "",
              passed: !!g.passed,
              feedback: g.feedback || "",
              gradedAt: g.createdAt || g.updatedAt,
            };
          }
        });
      }

      setGrades(gradesMap);
    } catch (err) {
      console.error("Error fetching grades:", err);
    }
  };

  // Change numeric score; auto-updates pass/fail & a simple default feedback
  const handleGradeChange = (lessonId, studentId, scoreValue) => {
    const score = scoreValue === "" ? "" : parseInt(scoreValue, 10);

    // Guard: only allow empty or 0..100
    if (score !== "" && (Number.isNaN(score) || score < 0 || score > 100)) {
      return;
    }

    setGrades((prev) => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        [studentId]: {
          ...prev[lessonId]?.[studentId],
          score,
          passed: score !== "" ? score >= 50 : false,
          // Do not overwrite user's custom feedback if already present
          feedback:
            score === ""
              ? (prev[lessonId]?.[studentId]?.feedback || "")
              : (prev[lessonId]?.[studentId]?.feedback || `Graded: ${score}/100`),
          gradedAt: new Date().toISOString(),
        },
      },
    }));
  };

  // Change feedback text (freeform)
  const handleFeedbackChange = (lessonId, studentId, text) => {
    setGrades((prev) => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        [studentId]: {
          ...prev[lessonId]?.[studentId],
          feedback: text,
        },
      },
    }));
  };

  // Save all filled grades (non-empty score) for one lesson
  const handleBulkSave = async (lessonId) => {
    const lessonGrades = grades[lessonId] || {};
    const entries = Object.entries(lessonGrades).filter(
      ([, g]) => g && g.score !== "" && g.score !== null
    );

    if (entries.length === 0) {
      showPopup("No grades to save.");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      // Snapshot current rows to rollback on individual failures
      const previousRows = entries.reduce((acc, [sid, g]) => {
        acc[sid] = { ...(g || {}) };
        return acc;
      }, {});

      // Prepare requests
      const requests = entries.map(([studentId, g]) =>
        fetch("http://localhost:5050/grades", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            student: studentId,
            lesson: lessonId,
            classroom: classroom._id,
            score: g.score,
            feedback: g.feedback || `Graded: ${g.score}/100`,
          }),
        }).then(async (r) => {
          if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            throw new Error(e.message || "Failed to save a grade");
          }
          return r.json();
        })
      );

      const results = await Promise.allSettled(requests);

      // Rollback failed items
      const failed = [];
      results.forEach((res, i) => {
        const [studentId] = entries[i];
        if (res.status === "rejected") {
          failed.push(studentId);
          setGrades((prev) => ({
            ...prev,
            [lessonId]: {
              ...prev[lessonId],
              [studentId]: previousRows[studentId],
            },
          }));
        }
      });

      if (failed.length) {
        showPopup(`${failed.length} of ${entries.length} grades failed to save.`);
      } else {
        showPopup("All grades saved successfully!");
      }
    } catch (err) {
      console.error("Bulk save error:", err);
      showPopup("Something went wrong while saving.");
    }
  };

  // Expand/Collapse a lesson shelf
  const toggleShelf = (lessonId) => {
    setOpenShelves((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }));
  };

  // Remove member from class
  const handleDeleteMember = async (memberId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5050/classrooms/${classroom._id}/students/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Failed to remove student");
      }

      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      setOpenMenuMemberId(null);
    } catch (err) {
      console.error("Error deleting student:", err);
      alert(`Error removing student: ${err.message}`);
    }
  };

  // ---------------- Render ----------------

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar items={instructorMenu} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading classroom data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar items={instructorMenu} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={fetchClassroomData}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={instructorMenu} />

      <div className="flex flex-1 overflow-hidden">
        <main
          className={`flex-1 overflow-y-auto ${
            showMembers ? "w-3/4" : "w-full"
          } px-6 py-8`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              {/* Back button */}
              <Link
                to="/instructor-classroom"
                className="inline-flex items-center text-sm text-teal-700 border border-teal-300 rounded-md px-3 py-1.5 hover:bg-teal-50 mb-2"
              >
                ← Back
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {classroom?.name || "Classroom"}
              </h1>
              <p className="text-gray-600 mt-2">
                Manage grades for {members.length} students across{" "}
                {lessons.length} lessons
              </p>
            </div>

            <button
              onClick={() => setShowMembers(!showMembers)}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              {showMembers ? "Hide Members" : `View Members (${members.length})`}
            </button>
          </div>

          {/* Warning if not the classroom creator */}
          {!isCreator && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              ⚠️ You are not the owner of this classroom. You can view lessons
              and grades, but you cannot edit or remove the grades.
            </div>
          )}

          {/* Lessons */}
          <div className="space-y-6">
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <div
                  key={lesson._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200"
                >
                  {/* Lesson Header */}
                  <div
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleShelf(lesson._id)}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-gray-600 text-sm">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {members.length} students
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          openShelves[lesson._id]
                            ? "bg-teal-100 text-teal-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {openShelves[lesson._id] ? "▲ Hide" : "▼ Grade"}
                      </span>
                    </div>
                  </div>

                  {/* Grade table */}
                  {openShelves[lesson._id] && (
                    <div className="border-t border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-medium text-gray-900">
                          Student Grades
                        </h4>
                        {isCreator && (
                          <button
                            onClick={() => handleBulkSave(lesson._id)}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                          >
                            Save All Grades
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          {/* Column widths (keep layout consistent) */}
                          <colgroup>
                            <col className="w-1/5" />
                            <col className="w-1/6" />
                            <col /> {/* Feedback takes remaining but textarea is fixed width */}
                            <col className="w-1/6" />
                            <col className="w-1/6" />
                          </colgroup>

                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left pb-3 font-medium text-gray-700">
                                Student
                              </th>
                              <th className="text-left pb-3 font-medium text-gray-700">
                                Grade
                              </th>
                              <th className="text-left pb-3 font-medium text-gray-700">
                                Feedback
                              </th>
                              <th className="text-left pb-3 font-medium text-gray-700">
                                Result
                              </th>
                              <th className="text-left pb-3 font-medium text-gray-700">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {members.map((member) => {
                              const row =
                                grades[lesson._id]?.[member._id] || {};
                              const score =
                                row.score === 0 ? 0 : row.score ?? "";
                              const passed = !!row.passed;
                              const isSaving =
                                savingStates[`${lesson._id}-${member._id}`];
                              const isGraded = score !== "" && score !== null;

                              return (
                                <tr
                                  key={member._id}
                                  className="border-b border-gray-100 hover:bg-gray-50 align-top"
                                >
                                  {/* Student */}
                                  <td className="py-4">
                                    <span className="font-medium text-gray-900">
                                      {member.firstName} {member.lastName}
                                    </span>
                                  </td>

                                  {/* Grade input */}
                                  <td className="py-4">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      className="w-24 md:w-28 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                      value={score}
                                      onChange={(e) =>
                                        handleGradeChange(
                                          lesson._id,
                                          member._id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="0–100"
                                      disabled={!isCreator || isSaving}
                                    />
                                  </td>

                                  {/* Feedback (fixed width horizontally, can only resize vertically) */}
                                  <td className="w-1/3 py-4 pr-4">
                                    <textarea
                                      className="block w-[520px] max-w-full min-h-[2.5rem] h-16 max-h-64
                                                 border border-gray-300 rounded-md px-2 py-1 text-sm
                                                 resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                      value={row.feedback || ""}
                                      onChange={(e) =>
                                        handleFeedbackChange(
                                          lesson._id,
                                          member._id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Feedback"
                                      title={row.feedback || ""}
                                      disabled={!isCreator || isSaving}
                                    />
                                  </td>

                                  {/* Result (Pass/Fail) */}
                                  <td className="py-4">
                                    {!isGraded ? (
                                      <span className="text-gray-400 text-sm">
                                        –
                                      </span>
                                    ) : passed ? (
                                      <span className="text-green-600 font-medium flex items-center">
                                        ✅ Pass
                                      </span>
                                    ) : (
                                      <span className="text-red-600 font-medium flex items-center">
                                        ❌ Fail
                                      </span>
                                    )}
                                  </td>

                                  {/* Status chip */}
                                  <td className="py-4">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        isGraded
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {isGraded ? "Graded" : "Pending"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No Lessons Available
                </h3>
                <p className="text-gray-600">
                  Add lessons to this classroom to start grading students.
                </p>
              </div>
            )}

            {popup && (
              <div className="fixed inset-x-0 bottom-20 flex justify-center z-50">
                <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-lg shadow-lg">
                  {popup}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-1/4 bg-white border-l border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Class Members
                </h2>
                <button
                  onClick={() => setShowMembers(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {members.length} students enrolled
              </p>
            </div>

            <div className="p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {members.length > 0 ? (
                <ul className="space-y-3">
                  {members.map((member) => (
                    <li
                      key={member._id}
                      className="relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 block">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {member.email}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setOpenMenuMemberId(
                              openMenuMemberId === member._id
                                ? null
                                : member._id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        >
                          ⋮
                        </button>
                      </div>

                      {openMenuMemberId === member._id && (
                        <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => handleDeleteMember(member._id)}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove from Class
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No students enrolled in this classroom
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
