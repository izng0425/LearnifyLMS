import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { BookIcon, UsersIcon, CourseIcon, ClassroomIcon } from "../components/Icons";

export default function AdminClassroom() {
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

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [publishedTab, setPublishedTab] = useState("ongoing"); // "ongoing" or "past"
  const [search, setSearch] = useState("");
  const [ongoingClassrooms, setOngoingClassrooms] = useState([]);
  const [completedClassrooms, setCompletedClassrooms] = useState([]);

  useEffect(() => {
    fetchAllClassrooms();
    fetchOngoingClassrooms();
    fetchCompletedClassrooms();
  }, []);

  // Fetch all classrooms
  const fetchAllClassrooms = async () => {
    setLoading(true);
    setError("");
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5050/classrooms", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch classrooms");
      const data = await res.json();
      setClassrooms(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch ongoing classrooms using your backend endpoint
  const fetchOngoingClassrooms = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5050/classrooms/ongoing", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOngoingClassrooms(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch ongoing classrooms:", e);
    }
  };

  // Fetch completed classrooms using your backend endpoint
  const fetchCompletedClassrooms = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5050/classrooms/completed", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedClassrooms(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch completed classrooms:", e);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`http://localhost:5050/classrooms/${deleteTarget._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete classroom");
      setClassrooms((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      setSuccessMessage("Classroom deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 1000);
      
      // Refresh the ongoing and completed lists after deletion
      fetchOngoingClassrooms();
      fetchCompletedClassrooms();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete classroom. Please try again.");
    }
  };

  const displayId = (c) =>
    c.classroomId ||
    (typeof c._id === "string"
      ? c._id.replace(/^ObjectId\("?(.*)"?\)$/, "$1").slice(-8)
      : "—");

  const ownerOf = (c) => c.ownerName || c.owner || "—";

  const getStatus = (c) => {
    const s = typeof c.status === "string" ? c.status.toLowerCase() : "";
    if (s === "active") return "Active";
    if (s === "archived") return "Archived";
    if (s === "published") return "Published";
    return "Draft";
  };

  // Helper to determine if a classroom is ongoing or past using backend data
  const getClassroomTimeline = (classroom) => {
    // Check if classroom exists in ongoing classrooms array
    const isOngoing = ongoingClassrooms.some(ongoing => ongoing._id === classroom._id);
    const isCompleted = completedClassrooms.some(completed => completed._id === classroom._id);
    
    if (isOngoing) return "ongoing";
    if (isCompleted) return "past";
    
    // Fallback logic if backend endpoints fail
    if (classroom.endDate) {
      const endDate = new Date(classroom.endDate);
      const now = new Date();
      return endDate < now ? "past" : "ongoing";
    }
    
    if (classroom.startDate) {
      const startDate = new Date(classroom.startDate);
      const now = new Date();
      return startDate > now ? "ongoing" : "past";
    }
    
    return "ongoing";
  };

  // Filter classrooms based on status and timeline
  const filteredClassrooms = classrooms.filter((classroom) => {
    // First filter by main status (All, Published, Archived, Draft)
    if (statusFilter !== "All" && getStatus(classroom) !== statusFilter) {
      return false;
    }
    
    // If we're in Published tab, apply the ongoing/past filter using backend logic
    if (statusFilter === "Published") {
      const timeline = getClassroomTimeline(classroom);
      if (publishedTab === "ongoing" && timeline !== "ongoing") {
        return false;
      }
      if (publishedTab === "past" && timeline !== "past") {
        return false;
      }
    }
    
    // Then apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      return (
        classroom.title?.toLowerCase().includes(searchTerm) ||
        displayId(classroom).toLowerCase().includes(searchTerm) ||
        ownerOf(classroom).toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  return (
    <div className="flex">
      <Sidebar items={adminMenu} />

      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-teal-800">
            Existing classrooms
          </h1>
          <Link to="/admin-create-classroom">
            <button
              type="button"
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              + New classroom
            </button>
          </Link>
        </div>

        {/* Main Filter bar */}
        <div className="mt-4 flex gap-2">
          {["All", "Published", "Archived", "Draft"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                // Reset published tab to ongoing when switching away from Published
                if (status !== "Published") {
                  setPublishedTab("ongoing");
                }
              }}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                statusFilter === status
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Published Sub-tabs - Only show when Published filter is selected */}
        {statusFilter === "Published" && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setPublishedTab("ongoing")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                publishedTab === "ongoing"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              Ongoing Classes ({ongoingClassrooms.length})
            </button>
            <button
              onClick={() => setPublishedTab("past")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                publishedTab === "past"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              Past Classes ({completedClassrooms.length})
            </button>
          </div>
        )}

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

        {/* Loading / Error states */}
        {loading && <p className="mt-4 text-gray-500">Loading classrooms…</p>}
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {/* Classrooms grid */}
        {!loading && !error && (
          <>
            {filteredClassrooms.length === 0 ? (
              <div className="mt-4 rounded-xl border border-teal-200 bg-white p-6 text-slate-700">
                <p className="font-medium">
                  {statusFilter === "Published" 
                    ? `No ${publishedTab === "ongoing" ? "ongoing" : "past"} classrooms found.`
                    : "No classrooms yet."
                  }
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {statusFilter === "Published" 
                    ? `Try changing your search or ${publishedTab === "ongoing" ? "create a new classroom" : "check the ongoing tab"}.`
                    : "Create your first classroom to get started."
                  }
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClassrooms.map((room) => {
                  const id = displayId(room);
                  const owner = ownerOf(room);
                  const status = getStatus(room);
                  const timeline = getClassroomTimeline(room);
                  const statusCls =
                    status === "Published"
                      ? "bg-green-100 text-green-700"
                      : status === "Draft"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700";

                  // Timeline badge for Published classrooms
                  const timelineBadge = status === "Published" && (
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        timeline === "ongoing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {timeline === "ongoing" ? "Ongoing" : "Completed"}
                    </span>
                  );

                  return (
                    <div
                      key={room._id}
                      className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
                    >
                      <h2 className="text-lg font-semibold">
                        <Link
                          to="/admin-view-classroom"
                          state={{ classroom: room, backTo: "/admin-classroom" }}
                          className="hover:underline"
                        >
                          {room.title || "Untitled classroom"}
                        </Link>
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs text-teal-800">
                          ID: {id}
                        </span>
                        <span className="ml-2">Created by: {owner}</span>
                      </p>

                      {/* Display classroom duration and start time if available */}
                      {(room.duration || room.startTime) && (
                        <div className="mt-2 text-xs text-slate-500">
                          {room.duration && (
                            <p>Duration: {room.duration} weeks</p>
                          )}
                          {room.startTime && (
                            <p>Starts: {new Date(room.startTime).toLocaleDateString()}</p>
                          )}
                        </div>
                      )}

                      {/* Status and Timeline chips */}
                      <div className="mt-3 flex items-center">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusCls}`}
                        >
                          {status}
                        </span>
                        {timelineBadge}
                      </div>

                      {/* Student count */}
                      <div className="mt-2 text-sm text-slate-600">
                        <span className="font-medium">
                          {room.numStudents || 0} students enrolled
                        </span>
                      </div>

                      {/* Buttons (same as instructor) */}
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <Link
                            to={`/classroom-details/${room._id}`}
                            state={{ classroom: room, backTo: "/admin-classroom" }}
                            className="flex-1 rounded-md border border-teal-300 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 text-center transition-colors"
                          >
                            View Details
                          </Link>
                          <Link
                            to="/admin-view-classroom"
                            state={{ classroom: room }}
                            className="flex-1 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 text-center transition-colors"
                          >
                            Enter Classroom
                          </Link>
                        </div>
                      </div>

                      {/* Edit + Delete icons */}
                      <Link
                        to="/admin-edit-classroom"
                        state={{ classroom: room }}
                        className="absolute top-2 right-10 text-teal-600 hover:text-teal-800"
                        title="Edit classroom"
                      >
                        🖉
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(room)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        title="Delete classroom"
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h2 className="text-lg font-semibold text-teal-800 mb-4">
                Confirm Delete
              </h2>
              <p className="mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">{deleteTarget.title}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleDelete}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success toast */}
        {successMessage && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {successMessage}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}