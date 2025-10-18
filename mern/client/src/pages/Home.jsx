import { useState } from "react";
import Textbox from "../components/textbox";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(""); 
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5050/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }), // backend expects `email`
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Logged in:", data);

        sessionStorage.setItem("username", username);
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));


        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          if (data.role === "Student") {
            navigate("/student-course");
          } else if (data.role === "Instructor") {
            navigate("/instructor-lessons");
          } else if (data.role === "admin") {
            navigate("/admin-lessons"); 
          } else {
            navigate("/");
          }
        }, 1000);

      } else {
        console.error("❌ Login failed:", data.error);
        setError(data.error || "Login failed. Please try again."); // ✅ set error
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Server error, please try again later."); // ✅ show server error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Card container */}
      <div className="bg-white p-10 rounded-lg shadow-lg w-96 flex flex-col gap-6">
        {/* Colored LEARNIFY title */}
        <h1 className="text-4xl font-bold text-center mb-2">
          <span className="text-teal-500">LEARN</span>
          <span className="text-black">IFY</span>
        </h1>
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Login</h2>

        {/* Username */}
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Email:</label>
          <Textbox
            type="text"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>

        {/* Password with Show/Hide */}
        <div className="flex flex-col relative">
          <label className="mb-2 font-medium text-gray-700">Password:</label>
          <Textbox
            type={showPassword ? "text" : "password"} // 👈 toggle input type
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-11 text-sm text-teal-600 hover:underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Error + Success messages */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}

        {/* Login button */}
        <button
          onClick={handleLogin}
          className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
        >
          Login
        </button>

        {/* Signup link */}
        <p className="text-center mt-4 text-gray-700">
          No account?{" "}
          <Link to="/signup" className="text-teal-500 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
