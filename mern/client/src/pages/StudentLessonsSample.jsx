import React from "react";

// Student Lessons (teal-200 theme) — sample list UI
export default function StudentLessonsSample() {
  const weeks = [
    { title: "Week 1: Intro to Software Development", summary: "Syllabus, environment setup, short quiz." },
    { title: "Week 2: HTML & CSS Basics", summary: "Semantic HTML, modern CSS, responsive layout." },
    { title: "Week 3: JavaScript Fundamentals", summary: "Variables, functions, DOM, events." },
    { title: "Week 4: React Essentials", summary: "Components, props, state; build a small app." },
  ];

  return (
    <div className="min-h-screen bg-teal-50">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-teal-800">Web Development</h1>

        <div className="mt-6 space-y-3">
          {weeks.map((w, i) => (
            <div
              key={i}
              className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm transition hover:bg-teal-50"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-teal-900">{w.title}</p>
                <button
                  type="button"
                  className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  Open
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-700">{w.summary}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
