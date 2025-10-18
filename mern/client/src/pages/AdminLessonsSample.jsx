import React from "react";
import { Link } from "react-router-dom";

/**
 * AdminLessonsSample
 * - Same list UI as InstructorLessonsSample.
 * - Cards show: ID, Title, Owner. Includes Edit + Open (visual only).
 */
export default function AdminLessonsSample() {
  const existing = [
    { id: "w1", title: "Week 1: Intro to Software Development", createdBy: "alice@school.edu" },
    { id: "w2", title: "Week 2: HTML & CSS Basics", createdBy: "alice@school.edu" },
    { id: "w3", title: "Week 3: JavaScript Fundamentals", createdBy: "alice@school.edu" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-teal-800">Admin — Lessons (Sample)</h1>

        <Link to="/create-lessons">
          <button
            type="button"
            className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            title="Create a new lesson"
          >
            + New lesson
          </button>
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {existing.map((l) => (
          <div key={l.id} className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{l.title}</p>
                <p className="text-xs text-slate-600">ID: {l.id} · Owner: {l.createdBy}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit (pencil) */}
                <Link to="/edit-lessons">
                  <button
                    type="button"
                    className="rounded-md border border-teal-200 p-1.5 text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    aria-label={`Edit ${l.title}`}
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </Link>
                {/* Open (no routing yet) */}
                <button
                  type="button"
                  className="rounded-md border border-teal-200 px-3 py-1.5 text-sm text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function PencilIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
    </svg>
  );
}
