import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
} from "../controllers/announcementController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.post("/", protect, authorize("organizer"), createAnnouncement);
router.get("/", protect, getAnnouncements); // ownership/ticket check inside controller

export default router;
