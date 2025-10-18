// src/pages/StudentClassroom.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { CourseIcon, ClassroomIcon, BookIcon } from "../components/Icons";

export default function StudentClassroom() {
  // Sidebar menu for student
  const studentMenu = [
    { path: "/student-course", label: "Courses", icon: CourseIcon },
    { path: "/student-classroom", label: "Classrooms", icon: ClassroomIcon },
    { path: "/student-lessons", label: "Lessons", icon: BookIcon },
  ];

  // UI state
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolled, setEnrolled] = useState([]); // list of classroom _ids joined
  const [view, setView] = useState("All"); // "All" or "My"
  const [enrolledClassroom, setEnrolledClassroom] = useState(null);

  // Search
  const [search, setSearch] = useState("");

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [joinTarget, setJoinTarget] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null);

useEffect(() => {
  (async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");

      // Fetch available classrooms
      const classroomsRes = await fetch("http://localhost:5050/classrooms/my-classrooms", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch enrolled classroom IDs
      const enrolledRes = await fetch("http://localhost:5050/classrooms/my-enrolled", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!classroomsRes.ok || !enrolledRes.ok) {
        throw new Error(`HTTP error ${classroomsRes.status}`);
      }

      const classroomsData = await classroomsRes.json();
      const enrolledData = await enrolledRes.json();

      setClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
      setEnrolled(Array.isArray(enrolledData) ? enrolledData : []);
      setError("");
    } catch (e) {
      console.error("Error fetching data:", e);
      setError("Unable to reach server. Please try again later.");
    } finally {
      setLoading(false);
    }
  })();
}, []);

  
  const getStatus = (c) => {
    const s = typeof c.status === "string" ? c.status.toLowerCase() : "";
    if (s === "published") return "Published";
    if (s === "archived") return "Archived";
    return "Draft";
  };

  const getOwner = (c) => c.ownerName || c.owner || "—";
  const getDisplayId = (c) =>
    c.classroomId || (typeof c._id === "string" ? c._id.slice(-6) : "—");


const handleJoin = async (classroom) => {
  try {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`http://localhost:5050/classrooms/${classroom._id}/enrol`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to enrol");
    setEnrolled([...enrolled, classroom._id]);
    setEnrolledClassroom(classroom._id);
    setToastMessage(`Joined "${classroom.title}" successfully!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  } catch (e) {
    console.error(e);
    setToastMessage("Please leave your classroom before joining a new one.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }
};

const handleLeave = async (classroom) => {
  try {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`http://localhost:5050/classrooms/${classroom._id}/unenrol`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to unenrol");
    setEnrolled(enrolled.filter((id) => id !== classroom._id));
    setEnrolledClassroom(null);
    setToastMessage(`Left "${classroom.title}"`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  } catch (e) {
    console.error(e);
    setToastMessage("Failed to leave classroom");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }
};


  // Base visibility by view
  const visibleClassrooms =
    view === "My"
      ? classrooms.filter((c) => enrolled.includes(c._id))
      : classrooms.filter((c) => !enrolled.includes(c._id));

  // Apply search filter (title / id / owner)
  const filteredClassrooms = visibleClassrooms.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.title || "").toLowerCase().includes(q) ||
      getDisplayId(c).toLowerCase().includes(q) ||
      getOwner(c).toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex">
      <Sidebar items={studentMenu} />

      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            {view === "My" ? "My Classrooms" : "All Classrooms"}
          </h1>

        {/* Toggle view */}
          <div className="flex gap-2">
            <button
              onClick={() => setView("My")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                view === "My"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              My Classrooms
            </button>
            <button
              onClick={() => setView("All")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                view === "All"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Classrooms
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-6 mb-4">
          <input
            type="text"
            placeholder="Search classrooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
          />
        </div>

        {loading && <p className="mt-4 text-gray-500">Loading classrooms…</p>}
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {!loading && !error && (
          <>
            {filteredClassrooms.length === 0 ? (
              <div className="mt-4 rounded-xl border border-teal-200 bg-white p-6 text-slate-700">
                <p className="font-medium">
                  {search.trim()
                    ? "No classrooms match your search."
                    : view === "My"
                    ? "You haven't joined any classrooms yet."
                    : "No classrooms available."}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClassrooms.map((c) => {
                  const status = getStatus(c);
                  const statusCls =
                    status === "Published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700";

                  return (
                    <div
                      key={c._id}
                      className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
                    >
                       {/* Title (plain text, not a link) */}
                      <h2 className="text-lg font-semibold text-teal-800">{c.title}</h2>

                      {/* ID + Owner */}
                      <p className="mt-1 text-sm text-slate-500">
                        <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                          ID: {getDisplayId(c)}
                        </span>
                        <span className="ml-2">Created by: {getOwner(c)}</span>
                      </p>
                      

                      {/* Status chip */}
                      <span
                        className={`mt-3 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusCls}`}
                      >
                        {status}
                      </span>

                      {/* View Details button */}
                      {enrolled.includes(c._id) ? (
                        <div className="mt-3 space-y-2">
                          {/* Top row: two half-width buttons */}
                          <div className="flex gap-2">
                            {/* Left: View Details */}
                            <Link
                            to={`/classroom-details/${c._id}`}
                            state={{ classroom: c, backTo: "/student-classroom" }}
                              className="flex-1 rounded-md border border-teal-300 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 text-center transition-colors"
                          >
                            View Details
                          </Link>

                            {/* Right: Enter Classroom */}
                            <Link
                              to="/student-view-classroom"
                              state={{ classroom: c }}
                              className="flex-1 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 text-center transition-colors"
                            >
                              Enter Classroom
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <Link
                          to={`/classroom-details/${c._id}`}
                          state={{ classroom: c, backTo: "/student-classroom" }}
                          className="mt-3 w-full inline-block text-center rounded-md border border-teal-300 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                        >
                          View Classroom Details
                        </Link>
                      )}


                      {/* Join / Leave button (confirm via modal) */}
                      {!enrolled.includes(c._id) ? (
                        <button
                          onClick={() => setJoinTarget(c)}
                          className="mt-3 w-full rounded-md bg-teal-600 px-2 py-1 text-sm font-medium text-white hover:bg-teal-700"
                        >
                          Join
                        </button>
                      ) : (
                        <button
                          onClick={() => setLeaveTarget(c)}
                          className="mt-3 w-full rounded-lg bg-orange-200 text-orange-800 px-4 py-2 text-sm font-medium shadow-sm hover:bg-orange-300 transition-colors duration-200"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Join confirmation modal */}
        {joinTarget && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h2 className="text-lg font-semibold text-teal-800 mb-4">Confirm Join</h2>
              <p className="mb-6">
                Are you sure you want to join{" "}
                <span className="font-medium">{joinTarget.title}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setJoinTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                  onClick={() => {
                    handleJoin(joinTarget);
                    setJoinTarget(null);
                  }}
                >
                  Confirm Join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave confirmation modal */}
        {leaveTarget && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h2 className="text-lg font-semibold text-orange-800 mb-4">Confirm Leave</h2>
              <p className="mb-6">
                Are you sure you want to leave{" "}
                <span className="font-medium">{leaveTarget.title}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setLeaveTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  onClick={() => {
                    handleLeave(leaveTarget);
                    setLeaveTarget(null);
                  }}
                >
                  Confirm Leave
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 rounded-lg bg-yellow-100 border border-yellow-300 px-4 py-2 shadow-md text-yellow-800 text-sm font-medium">
            {toastMessage}
          </div>
        )}
      </main>
    </div>
  );
}
