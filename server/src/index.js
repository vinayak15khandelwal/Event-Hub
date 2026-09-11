import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";
import { startSeatHoldSweeper } from "./utils/seatHoldSweeper.js";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Seat from "./models/Seat.js";
import Booking from "./models/Booking.js";
import Ticket from "./models/Ticket.js";
import Announcement from "./models/Announcement.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

// A MongoDB transaction can implicitly create at most one new collection.
// The booking flow's transaction writes to both Booking and Ticket in one
// go - on a completely fresh database, if neither collection exists yet,
// that's two implicit collection creations in a single transaction, which
// MongoDB rejects. Model.init() resolves once a model's collection and
// indexes exist, so calling it for every model at startup - before the
// app accepts its first request - guarantees no transaction ever has to
// create a collection on the fly, in any environment (fresh Atlas
// cluster, fresh local Mongo, fresh test database).
const ensureCollectionsExist = () =>
  Promise.all(
    [User, Event, Seat, Booking, Ticket, Announcement].map((model) => model.init())
  );

const start = async () => {
  await connectDB();
  await ensureCollectionsExist();
  server.listen(PORT, () => {
    console.log(`EventHub server running on port ${PORT}`);
    // Periodically releases seat holds past their 2-minute expiry and
    // notifies the affected event rooms in real time (Day 4 requirement).
    startSeatHoldSweeper();
  });
};

start();
