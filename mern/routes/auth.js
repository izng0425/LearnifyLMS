import express from "express";
import bcrypt from "bcrypt";
import { Student, Instructor, User, Admin } from "../db/users.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
dotenv.config();


const router = express.Router();

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { title, firstName, lastName, email, password, role } = req.body;
    console.log("Creating user with role:", role);

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    if (role === "Student") {
      user = await Student.create({ username: email, password: hashedPassword, title, firstName, lastName });
    } else if (role === "Instructor") {
      user = await Instructor.create({ username: email, password: hashedPassword, title, firstName, lastName });
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    // await newUser.save();
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already in use" }); 
    }

    res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ username: email });

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password. Try again." });
    }

    console.log("Loaded SECRET_KEY:", process.env.SECRET_KEY); 
    console.log("SECRET_KEY from env:", process.env.SECRET_KEY);
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.username },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    user.lastLogin = new Date();
    user.status = 'Active';
    await user.save();

    // If everything is fine, send back role + user info
    res.status(200).json({
      message: "Login successful",
      role: user.role, 
      token  
    });

  } catch (err) {
    console.error("❌ Error logging in:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔍 New endpoint to check current user
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "Current user",
    user: req.user, // comes from decoded token
  });
});

export default router;
