import jwt from "jsonwebtoken";

// Signs a JWT carrying the user id and role claim. Every protected route
// verifies this server-side (see authMiddleware.js) - the brief requires
// role claims to never be trusted from the client alone.
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default generateToken;
