import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route
router.get("/", authMiddleware, async (req, res) => {
  res.json({ message: `Welcome ${req.user.email}, here are your lessons` });
});

export default router;

// // routes/protected.js
// import express from "express";
// import { authenticateToken, requireRole } from "../middleware/auth.js";

// const router = express.Router();

// // Example protected route
// router.get("/profile", authenticateToken, async (req, res) => {
//   try {
//     // req.user contains the decoded token (id, role, email)
//     const user = await User.findById(req.user.id).select("-password");
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Admin-only route
// router.get("/admin-dashboard", authenticateToken, requireRole("Admin"), (req, res) => {
//   res.json({ message: "Welcome to admin dashboard" });
// });

// // Instructor-only route  
// router.get("/instructor-courses", authenticateToken, requireRole("Instructor"), (req, res) => {
//   res.json({ message: "Instructor courses" });
// });

// export default router;