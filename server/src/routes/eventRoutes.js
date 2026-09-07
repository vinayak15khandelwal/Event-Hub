import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Specific routes before the "/:id" catch-all, so "/mine/list" isn't
// swallowed by the :id param matcher.
router.get("/mine/list", protect, authorize("organizer"), getMyEvents);

router.get("/", getEvents);
router.post("/", protect, authorize("organizer"), createEvent);

router.get("/:id", getEventById);
router.put("/:id", protect, authorize("organizer"), updateEvent);
router.delete("/:id", protect, authorize("organizer"), deleteEvent);

export default router;
