// src/components/Icons.js
/* ---- ICONS ---- */
export function BookIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20V21H6.5A2.5 2.5 0 0 1 4 18.5V4.5z" />
    </svg>
  );
}

export function UsersIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function PersonIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function LogoutIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function CourseIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* A graduation cap icon */}
      <path d="M22 10l-10-5L2 10l10 5 10-5z" />
      <path d="M6 12v5c0 .7.4 1.3 1 1.6l5 2.4 5-2.4c.6-.3 1-.9 1-1.6v-5" />
    </svg>
  );
}

export function ClassroomIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Chalkboard */}
      <rect x="3" y="3" width="18" height="12" rx="2" ry="2" />
      {/* Teacher's desk */}
      <line x1="7" y1="21" x2="17" y2="21" />
      {/* Legs */}
      <line x1="9" y1="21" x2="9" y2="15" />
      <line x1="15" y1="21" x2="15" y2="15" />
      {/* Student desk */}
      <path d="M6 17h12" />
    </svg>
  );
}

export function ReportIcon({ className = "h-5 w-5", ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      {/* axes */}
      <path d="M4 4v16h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* bars */}
      <rect x="7" y="12" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="12" y="9"  width="3" height="9" rx="1" fill="currentColor" />
      <rect x="17" y="6"  width="3" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}