import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Verifies the JWT and attaches the authenticated user to req.user.
// Accepts the token from an httpOnly cookie (browser flow) or an
// Authorization: Bearer header (useful for API clients/tests).
export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized - no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Re-fetch the user rather than trusting the decoded payload alone -
    // ensures a deleted/deactivated user can't keep using an old token.
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error("Not authorized - user no longer exists");
    }

    req.user = user; // includes .role, verified server-side
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized - invalid or expired token");
  }
});

// Role guard - use after `protect`. Usage: authorize("organizer")
// or authorize("organizer", "attendee") for multiple allowed roles.
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not permitted to access this resource`
      );
    }
    next();
  };
};
