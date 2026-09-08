import express from "express";
import {
  getSeatsForEvent,
  holdSeat,
  releaseSeat,
} from "../controllers/seatController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

// mergeParams so req.params.eventId (from the parent mount path) is visible here
const router = express.Router({ mergeParams: true });

router.get("/", getSeatsForEvent);
router.post("/:seatId/hold", protect, authorize("attendee"), holdSeat);
router.post("/:seatId/release", protect, authorize("attendee"), releaseSeat);

export default router;
