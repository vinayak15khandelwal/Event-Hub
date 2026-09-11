import express from "express";
import {
  getEventAnalytics,
  getEventAttendees,
} from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/analytics", protect, authorize("organizer"), getEventAnalytics);
router.get("/attendees", protect, authorize("organizer"), getEventAttendees);

export default router;
