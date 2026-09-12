import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("attendee"), createBooking);
router.get("/mine", protect, authorize("attendee"), getMyBookings);
router.get("/:id", protect, getBookingById); // ownership enforced in controller
router.post("/:id/cancel", protect, authorize("attendee"), cancelBooking); // ownership enforced in controller

export default router;
