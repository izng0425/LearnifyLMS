import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

export default function AdminViewInstructor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const instructor = location.state?.instructor || {};
  console.log("ID", id);


  const [stats, setStats] = useState({
    lessons: 0,
    classrooms: 0,
    courses: 0,
  });

  const [lessonList, setLessonList] = useState([]);
  const [classroomList, setClassroomList] = useState([]);
  const [courseList, setCourseList] = useState([]);

  useEffect(() => {
    console.log("Instructor ID from useParams:", id);

    if (!instructor) 
      return;

    const fetchData = async () => {
      try {
        const [lessRes, courseRes, classRes] = await Promise.all([
          fetch(`http://localhost:5050/api/instructors/${instructor._id}/lessons`),
          fetch(`http://localhost:5050/api/instructors/${instructor._id}/courses`),
          fetch(`http://localhost:5050/api/instructors/${instructor._id}/classrooms`),
        ]);

        const [lessons, courses, classrooms] = await Promise.all([
          lessRes.json(),
          courseRes.json(),
          classRes.json(),
        ]);

        console.log("Fetched data:", { lessons, courses, classrooms });


        setLessonList(lessons.map((l) => l.title || "Untitled Lesson"));
        setCourseList(courses.map((c) => c.title || "Untitled Course"));
        setClassroomList(classrooms.map((cl) => cl.title || "Untitled Classroom"));

        setStats({
          lessons: lessons.length,
          courses: courses.length,
          classrooms: classrooms.length,
        });
      } catch (err) {
        console.error("Failed to fetch instructor data:", err);
      }
    };

    fetchData();
  }, [id]);

  const instructorName = `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim();

  return (
    <div className="p-6 bg-teal-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-teal-200 text-teal-900 px-4 py-2 rounded-lg hover:bg-teal-300 transition"
      >
        ← Back
      </button>

      {/* Instructor Heading */}
      <h1 className="text-3xl font-bold mb-6 text-teal-800">
        Instructor Report: {instructorName}
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lessons */}
        <div className="relative group bg-white rounded-2xl shadow p-6 border-t-4 border-teal-500 hover:shadow-lg transition">
          <p className="text-lg font-semibold text-teal-700">Lessons Taught</p>
          <p className="text-4xl font-bold text-teal-900">{stats.lessons}</p>

          {/* Lesson List */}
          <div className="absolute left-0 top-full mt-2 w-full bg-white shadow-lg rounded-xl p-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all z-10">
            <h2 className="font-semibold text-teal-700 mb-2">
              {instructorName || "Instructor"}’s Lessons
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {lessonList.map((lesson, index) => (
                <li key={index}>{lesson}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Courses */}
        <div className="relative group bg-white rounded-2xl shadow p-6 border-t-4 border-teal-500 hover:shadow-lg transition">
          <p className="text-lg font-semibold text-teal-700">Courses Created</p>
          <p className="text-4xl font-bold text-teal-900">{stats.courses}</p>

          {/* Course List */}
          <div className="absolute left-0 top-full mt-2 w-full bg-white shadow-lg rounded-xl p-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all z-10">
            <h2 className="font-semibold text-teal-700 mb-2">
              {instructorName || "Instructor"}’s Courses
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {courseList.map((course, index) => (
                <li key={index}>{course}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Classrooms */}
        <div className="relative group bg-white rounded-2xl shadow p-6 border-t-4 border-teal-500 hover:shadow-lg transition">
          <p className="text-lg font-semibold text-teal-700">Classrooms Created</p>
          <p className="text-4xl font-bold text-teal-900">{stats.classrooms}</p>

          {/* Classroom List */}
          <div className="absolute left-0 top-full mt-2 w-full bg-white shadow-lg rounded-xl p-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all z-10">
            <h2 className="font-semibold text-teal-700 mb-2">
              {instructorName || "Instructor"}’s Classrooms
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {classroomList.map((room, index) => (
                <li key={index}>{room}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
