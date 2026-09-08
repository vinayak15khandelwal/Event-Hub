import asyncHandler from "express-async-handler";
import Event from "../models/Event.js";
import Seat from "../models/Seat.js";
import { buildSeatsForEvent } from "../utils/generateSeats.js";

// Throws a consistent 403 if the requesting user isn't the event's organizer.
// Centralized here so update/delete can't drift out of sync with each other.
const assertIsOwner = (event, userId) => {
  if (event.organizer.toString() !== userId.toString()) {
    const err = new Error("You do not own this event");
    err.statusCode = 403;
    throw err;
  }
};

// @desc   Create a new event
// @route  POST /api/events
// @access Private (organizer only)
export const createEvent = asyncHandler(async (req, res) => {
  const { name, description, category, date, venue, capacity, priceTiers } =
    req.body;

  const event = await Event.create({
    name,
    description,
    category,
    date,
    venue,
    capacity,
    priceTiers,
    organizer: req.user._id,
  });

  // Generate one Seat document per unit of price-tier quantity. This isn't
  // wrapped in a native MongoDB transaction: Atlas (a replica set) supports
  // those, but the local test environment (a single mongodb-memory-server
  // instance) does not, and multi-document transactions aren't required
  // here the way they are for Day 5's actual booking commit. Instead we use
  // a compensating delete (saga-style) - if seat generation fails, the
  // just-created event is rolled back manually so we never end up with an
  // event that has no seats.
  try {
    const seats = buildSeatsForEvent(event);
    await Seat.insertMany(seats);
  } catch (seatError) {
    await event.deleteOne();
    res.status(500);
    throw new Error(`Failed to generate seat map: ${seatError.message}`);
  }

  res.status(201).json({ success: true, event });
});

// @desc   List events with search/category/date filters + pagination
// @route  GET /api/events?search=&category=&from=&to=&page=&limit=
// @access Public
export const getEvents = asyncHandler(async (req, res) => {
  const { search, category, from, to, page = 1, limit = 12 } = req.query;

  const query = { status: "published" };

  if (search) {
    query.$text = { $search: search };
  }
  if (category) {
    query.category = category;
  }
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort({ date: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("organizer", "name"),
    Event.countDocuments(query),
  ]);

  res.json({
    success: true,
    events,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    },
  });
});

// @desc   Get a single event by id
// @route  GET /api/events/:id
// @access Public
export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "organizer",
    "name email"
  );

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  res.json({ success: true, event });
});

// @desc   List the authenticated organizer's own events (any status)
// @route  GET /api/events/mine/list
// @access Private (organizer only)
export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, events });
});

// @desc   Update an event (owner only)
// @route  PUT /api/events/:id
// @access Private (organizer only, must own the event)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  assertIsOwner(event, req.user._id);

  const capacityOrTiersChanging =
    (req.body.capacity !== undefined && req.body.capacity !== event.capacity) ||
    req.body.priceTiers !== undefined;

  if (capacityOrTiersChanging) {
    const hasLockedSeats = await Seat.exists({
      event: event._id,
      status: { $ne: "available" },
    });
    if (hasLockedSeats) {
      res.status(400);
      throw new Error(
        "Can't change capacity or price tiers once seats are held or booked"
      );
    }
  }

  const editableFields = [
    "name",
    "description",
    "category",
    "date",
    "venue",
    "capacity",
    "priceTiers",
    "status",
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });

  const updated = await event.save();

  if (capacityOrTiersChanging) {
    // Safe to regenerate wholesale - the guard above already confirmed
    // every existing seat was still "available" (none held/booked).
    await Seat.deleteMany({ event: updated._id });
    await Seat.insertMany(buildSeatsForEvent(updated));
  }

  res.json({ success: true, event: updated });
});

// @desc   Delete an event (owner only)
// @route  DELETE /api/events/:id
// @access Private (organizer only, must own the event)
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  assertIsOwner(event, req.user._id);

  await Seat.deleteMany({ event: event._id });
  await event.deleteOne();
  res.json({ success: true, message: "Event deleted" });
});
