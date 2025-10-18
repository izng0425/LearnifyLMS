// src/pages/StudentViewClassroom.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

export default function StudentViewClassroom() {
  const location = useLocation();
  const { classroom } = location.state || {};

  // student menu without student list
  const studentMenu = [
    { path: "/student-course", label: "Courses", icon: CourseIcon },
    { path: "/student-classroom", label: "Classrooms", icon: ClassroomIcon },
    { path: "/student-lessons", label: "Lessons", icon: BookIcon },
  ];

  const [lessons, setLessons] = useState([]);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [openShelves, setOpenShelves] = useState({});
  const [myGrades, setMyGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classroom) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");

        // ✅ fetch published lessons only
        const res = await fetch(`http://localhost:5050/classrooms/my-lessons`, {
          
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch lessons");
        const lessons = await res.json();
        setLessons(Array.isArray(lessons) ? lessons : []);

        // fetch members just for viewing
        const membersRes = await fetch(
          `http://localhost:5050/classrooms/${classroom._id}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!membersRes.ok) throw new Error("Failed to fetch student list");
        const membersData = await membersRes.json();
        setMembers(membersData);

        // fetch grades for logged-in student
        await fetchMyGrades();
      } catch (err) {
        console.error(err);
        setError("Failed to load classroom information");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classroom]);


  const fetchMyGrades = async () => {
  try {
    const token = sessionStorage.getItem("token");

    // first get the logged-in student
    const studentRes = await fetch("http://localhost:5050/api/students/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Student response status:", studentRes.status);
    const student = await studentRes.json();
    console.log("Student data:", student);


    // now fetch progress (grades) for this student
    console.log("Fetching progress for studentId:", student.id);
    const res = await fetch(`http://localhost:5050/grades/progress/${student.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch progress");
    const data = await res.json();


    // ✅ THEN log it
    console.log("Grades from backend:", data.grades);
    // Map lessonId → grade
    const map = {};
    data.grades.forEach((g) => {
      const lessonKey = g.lessonId;  // ✅ correct field from backend
      if (lessonKey) {
        map[lessonKey.toString()] = {
          score: g.score === "-" ? null : g.score,
          passed: g.passed,
          feedback: g.feedback || "",
        };
      }
    });

        
    console.log("Grade map:", map)

    setMyGrades(map);
  } catch (err) {
    console.error("Error fetching my grades:", err);
  }
};


  const toggleShelf = (lessonId) =>
    setOpenShelves((prev) => ({ ...prev, [lessonId]: !prev[lessonId] }));

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar items={studentMenu} />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading classroom data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar items={studentMenu} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar items={studentMenu} />

      <div className="flex flex-1">
        <main className={`transition-all duration-300 ${showMembers ? "w-3/4" : "w-full"} px-4 py-8`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-teal-800">
              {classroom ? classroom.title : "Classroom"}
            </h1>

            <button
              onClick={() => setShowMembers(!showMembers)}
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Members
            </button>
          </div>

          <div className="space-y-3">
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <div key={lesson._id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div
                    className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleShelf(lesson._id)}
                  >
                    <span className="font-medium">
                      {lesson.lessonId && `${lesson.lessonId} - `}
                      {lesson.title || "Untitled lesson"}
                    </span>
                    <span className="text-sm text-teal-700">
                      {openShelves[lesson._id] ? "▲ Hide" : "▼ Show"} My Grade
                    </span>
                  </div>

                  {openShelves[lesson._id] && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-2xl">
                    {(() => {
                      const lessonKey = lesson._id?.toString(); // ✅ always use _id
                      const grade = myGrades[lessonKey];
                      console.log("Rendering grade for lesson:", lessonKey, "→", grade);

                      // if no grade, show nothing
                      if (!grade) return null;

                      return (
                        <div className="space-y-3">
                          {/* Grade info */}
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                              Your Grade:
                              <span className="ml-2 text-base font-semibold text-gray-900">
                                {grade.score ?? "-"}
                              </span>
                            </p>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                grade.passed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {grade.passed ? "PASS" : "FAIL"}
                            </span>
                          </div>

                          {/* Feedback */}
                          {grade.feedback && (
                            <div className="border-t border-gray-200 pt-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-700">Feedback:</span>{" "}
                                {grade.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}


                </div>
              ))
            ) : (
              <p className="text-gray-500">No lessons in this classroom.</p>
            )}
          </div>
        </main>

        {showMembers && (
          <div className="w-1/4 bg-white border-l border-gray-200 shadow-lg">
            <div className="p-4 flex items-center justify-between border-b">
              <h2 className="text-lg font-semibold">Class Members</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
                {members.length > 0 ? (
                  members.map((member) => (
                    <li
                      key={member._id}
                      className="relative rounded-md border border-gray-200 px-3 py-2 shadow-sm flex items-center justify-between"
                    >
                      <span>
                        {member.firstName} {member.lastName}
                      </span>
                      {/* no edit/remove menu for students */}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No students in this classroom.</p>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
