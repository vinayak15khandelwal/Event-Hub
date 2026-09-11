import asyncHandler from "express-async-handler";
import Event from "../models/Event.js";
import Announcement from "../models/Announcement.js";
import Ticket from "../models/Ticket.js";
import { assertIsOwner } from "./eventController.js";
import { getIO } from "../socket.js";

// @desc   Send an announcement to everyone who booked this event
// @route  POST /api/events/:eventId/announcements
// @access Private (organizer only, must own the event)
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { subject, message } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  assertIsOwner(event, req.user._id);

  const announcement = await Announcement.create({
    event: eventId,
    organizer: req.user._id,
    subject,
    message,
  });

  // "Send" here means: persisted for any ticket-holder to read (see
  // getAnnouncements below), plus a live push to anyone with this event's
  // page open right now - scoped to that event's room, same as seat
  // updates. There's no real email/SMS gateway wired up (no such service
  // was in scope for this project), so this is the honest mock-equivalent
  // of "sent".
  const io = getIO();
  if (io) {
    io.to(`event:${eventId}`).emit("announcement", {
      _id: announcement._id,
      subject: announcement.subject,
      message: announcement.message,
      createdAt: announcement.createdAt,
    });
  }

  res.status(201).json({ success: true, announcement });
});

// @desc   List announcements for an event
// @route  GET /api/events/:eventId/announcements
// @access Private (the organizer who owns the event, or an attendee holding a ticket to it)
export const getAnnouncements = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (!isOwner) {
    const hasTicket = await Ticket.exists({ event: eventId, user: req.user._id });
    if (!hasTicket) {
      res.status(403);
      throw new Error("Only the organizer or a ticket holder can view announcements");
    }
  }

  const announcements = await Announcement.find({ event: eventId }).sort({
    createdAt: -1,
  });

  res.json({ success: true, announcements });
});
