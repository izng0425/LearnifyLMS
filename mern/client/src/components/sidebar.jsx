import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogoutIcon } from "./Icons";

export default function Sidebar({ items = [], children }) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-50
          ${isOpen ? "w-64" : "w-14"}
          bg-white border-r border-slate-200 shadow-md transition-all duration-300`}
      >
        <div className="flex flex-col w-full h-full">
          {/* Toggle button */}
          <div className="flex items-center justify-end p-2 border-b border-slate-200">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col justify-center items-center w-8 h-8"
            >
              <span className="block w-5 h-0.5 bg-slate-700 mb-1"></span>
              <span className="block w-5 h-0.5 bg-slate-700 mb-1"></span>
              <span className="block w-5 h-0.5 bg-slate-700"></span>
            </button>
          </div>

          {/* Sidebar menu */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  location.pathname === item.path
                    ? "bg-teal-100 text-teal-800 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {isOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Bottom logout */}
          <div className="border-t border-slate-200 p-2">
            <button
              type="button"
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-red-600 hover:bg-red-50 text-sm"
              onClick={handleLogout}
            >
              <LogoutIcon className="h-5 w-5" />
              {isOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content (pushed aside depending on sidebar state) */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-14"
        } p-4`}
      >
        {children}
      </main>
    </div>
  );
}
