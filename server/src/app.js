import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";

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
app.use("/api/events", eventRoutes);
app.use("/api/events/:eventId/seats", seatRoutes);
// Day 5: app.use("/api/bookings", bookingRoutes);
// Day 6: app.use("/api/dashboard", dashboardRoutes);
// Day 7: app.use("/api/checkin", checkinRoutes);

// --- 404 + error handling (always last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
