import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const isProd = process.env.NODE_ENV === "production";

// Shared cookie options - httpOnly so JS can't read the token (XSS mitigation).
// sameSite/secure tightened in production since frontend/backend are on
// different domains (Vercel/Render) once deployed.
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @desc   Register a new user (attendee or organizer)
// @route  POST /api/auth/register
// @access Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are all required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === "organizer" ? "organizer" : "attendee", // never trust an arbitrary role string
  });

  const token = generateToken(user);
  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token, // also returned in-body for non-browser clients / Postman testing
  });
});

// @desc   Log in an existing user
// @route  POST /api/auth/login
// @access Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // password has `select: false` on the schema, so it must be explicitly requested
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user);
  res.cookie("token", token, cookieOptions);

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

// @desc   Get the currently authenticated user
// @route  GET /api/auth/me
// @access Private
export const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// @desc   Log out - clears the auth cookie
// @route  POST /api/auth/logout
// @access Private
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", { ...cookieOptions, maxAge: 0 });
  res.json({ success: true, message: "Logged out" });
});
