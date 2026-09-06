import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { protect, authorize } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// --- Health check (proves the monorepo + DB wiring works) ---
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "EventHub API is running" });
});

// --- Feature routes ---
app.use("/api/auth", authRoutes);
// Day 3: app.use("/api/events", eventRoutes);
// Day 4-5: app.use("/api/bookings", bookingRoutes);
// Day 6: app.use("/api/dashboard", dashboardRoutes);
// Day 7: app.use("/api/checkin", checkinRoutes);

// Demo route showing the protect + authorize pattern - organizer CRUD routes
// on Day 3 will follow this exact shape. Safe to delete once Day 3 lands.
app.get(
  "/api/organizer-only-demo",
  protect,
  authorize("organizer"),
  (req, res) => {
    res.json({ success: true, message: `Welcome, organizer ${req.user.name}` });
  }
);

// --- 404 + error handling (always last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
