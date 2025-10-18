import React from "react";
import { useState } from "react";
import Textbox from "../components/textbox";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);
  const [role, setRole] = useState(""); // student or instructor
  const [passwordErrors, setPasswordErrors] = useState([])
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // Track field-specific errors

  const navigate = useNavigate();

  // Validate all fields
  const validateAllFields = () => {
    const errors = {};
    
    if (!title) errors.title = "Title is required";
    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    if (!role) errors.role = "Role is required";
    
    // Additional email validation
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

        // ✅ check password confirmation
    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    return errors;
  };

  // Password validation rules
  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("At least 8 characters");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("At least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("At least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("At least one number")
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("At least one special character");
    }

    return errors;
  };

  // Clear field error when user starts typing
  const clearFieldError = (fieldName) => {
    setFieldErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Field change handlers with error clearing
  const handleTitleChange = (value) => {
    setTitle(value);
    if (value) clearFieldError('title');
  };

  const handleFirstNameChange = (value) => {
    setFirstName(value);
    if (value) clearFieldError('firstName');
  };

  const handleLastNameChange = (value) => {
    setLastName(value);
    if (value) clearFieldError('lastName');
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (value) clearFieldError('email');
    // Additional email format validation
    if (value && !/\S+@\S+\.\S+/.test(value)) {
      setFieldErrors(prev => ({...prev, email: "Please enter a valid email address"}));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value) clearFieldError('password');
    setPasswordErrors(validatePassword(value));
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (value) clearFieldError("confirmPassword");
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole) clearFieldError('role');
  };

  const handleRegister = async () => {
    setError("");
    setFieldErrors({});
    
    // Validate all fields first
    const fieldValidationErrors = validateAllFields();
    if (Object.keys(fieldValidationErrors).length > 0) {
      setFieldErrors(fieldValidationErrors);
      return;
    }

    // Then validate password strength
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      setPasswordErrors(passwordValidationErrors);
      setFieldErrors({...fieldErrors, password: "Password doesn't meet requirements"});
      return;
    }

    try {
      const response = await fetch("http://localhost:5050/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, firstName, lastName, email, password, role })
      });

      const data = await response.json();
      if (response.ok) {
        console.log("✅ Registered:", data);
        setError("");
        setSuccess("Account created successfully!");
        setTimeout(() => {
          setSuccess("");
          navigate("/"); // go back to login after 1s
        }, 1000);
      } else {
        console.error("❌ Error:", data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Server error, please try again later.");
    }
  };

  // Helper function to show error for a field
  const hasError = (fieldName) => fieldErrors[fieldName];
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4">
        {/* Logo */}
        <h1 className="text-4xl font-bold text-center">
          <span className="text-teal-400">Learn</span>
          <span className="text-black">ify</span>
        </h1>
        <p className="text-center text-gray-600 uppercase text-sm mb-4">
          LEARNING MANAGEMENT SYSTEM
        </p>

        {/* Register title */}
        <h2 className="text-2xl font-semibold text-center mb-4">Register</h2>

        {/* Title dropdown */}
        <div className="mb-3">
          <select
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              hasError('title') ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Title</option>
            <option value="Mr">Mr</option>
            <option value="Ms">Ms</option>
            <option value="Mrs">Mrs</option>
            <option value="Other">Other</option>
          </select>
          {hasError('title') && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* First & Last Name */}
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <Textbox
              type="text"
              placeholder="First Name *"
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                hasError('firstName') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {hasError('firstName') && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
            )}
          </div>
          <div className="flex-1">
            <Textbox
              type="text"
              placeholder="Last Name *"
              value={lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                hasError('lastName') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {hasError('lastName') && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mb-3">
          <Textbox
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              hasError('email') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {hasError('email') && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password with show/hide */}
        <div className="mb-3">
          <div className="relative">
            <Textbox
              type={showPassword ? "text" : "password"}
              placeholder="Password *"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                hasError('password') ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {hasError('password') && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password field ✅ */}
        <div className="mb-3">
          <div className="relative">
          <Textbox
            type={showConfirmedPassword ? "text" : "password"}
            placeholder="Confirm Password *"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              hasError("confirmPassword") ? "border-red-500" : "border-gray-300"
            }`}
          />
            <button
              type="button"
              onClick={() => setShowConfirmedPassword(!showConfirmedPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showConfirmedPassword ? "Hide" : "Show"}
            </button>
          </div>
          {hasError("confirmPassword") && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Password requirements */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Password must contain:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className={password.length >= 8 ? "text-green-500" : "text-gray-500"}>✓ At least 8 characters</li>
            <li className={/[A-Z]/.test(password) ? "text-green-500" : "text-gray-500"}>✓ One uppercase letter</li>
            <li className={/[a-z]/.test(password) ? "text-green-500" : "text-gray-500"}>✓ One lowercase letter</li>
            <li className={/\d/.test(password) ? "text-green-500" : "text-gray-500"}>✓ One number</li>
            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-500" : "text-gray-500"}>✓ One special character</li>
          </ul>
        </div>

        {/* Role selection */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Register as: *</p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleRoleChange("Student")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                role === "Student" 
                  ? "bg-teal-500 text-white border-2 border-teal-500" 
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-400"
              } ${hasError('role') ? 'border-red-500' : ''}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("Instructor")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                role === "Instructor" 
                  ? "bg-teal-500 text-white border-2 border-teal-500" 
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-400"
              } ${hasError('role') ? 'border-red-500' : ''}`}
            >
              Instructor
            </button>
          </div>
          {hasError('role') && (
            <p className="text-red-500 text-xs mt-2 text-center">{fieldErrors.role}</p>
          )}
          
          {/* Role descriptions */}
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>🎓 Student - Access learning materials and courses</p>
            <p>👨‍🏫 Instructor - Create and manage courses</p>
          </div>
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">{error}</p>}
        
        {/* Success message */}
        {success && <p className="text-green-500 text-sm text-center p-2 bg-green-50 rounded">{success}</p>}

        {/* Register button */}
        <button
          onClick={handleRegister}
          className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors mt-4"
        >
          Create Account
        </button>

        {/* Already have an account */}
        <p className="text-center mt-4 text-gray-700">
          Already have an account?{" "}
          <Link to="/" className="text-teal-500 font-semibold hover:underline">
            Log In
          </Link>
        </p>

        {/* Required fields note */}
        <p className="text-xs text-gray-400 text-center mt-2">
          * Required fields
        </p>
      </div>
    </div>
  );
}