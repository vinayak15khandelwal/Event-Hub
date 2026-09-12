import express from "express";
import { checkInTicket, getCheckinStats } from "../controllers/checkinController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.post("/", protect, authorize("organizer"), checkInTicket);
router.get("/stats", protect, authorize("organizer"), getCheckinStats);

export default router;
