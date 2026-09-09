import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import app from "../app.js";
import Event from "../models/Event.js";
import { verifyTicketToken } from "../utils/qrToken.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_jest_only";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.QR_SECRET = process.env.QR_SECRET || "test_qr_secret_for_jest_only";

let replSet;

beforeAll(async () => {
  // Transactions require a replica set - a single-member one is enough and
  // still far faster to boot than a real multi-node cluster.
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}, 180000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const registerOrganizer = async (email = "organizer@example.com") => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Rahul Verma",
    email,
    password: "password123",
    role: "organizer",
  });
  return res.body.token;
};

const registerAttendee = async (email = "attendee@example.com") => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Priya Sharma",
    email,
    password: "password123",
    role: "attendee",
  });
  return { token: res.body.token, userId: res.body.user.id };
};

const eventPayload = {
  name: "Booking Test Conf",
  category: "web-dev",
  date: daysFromNow(30),
  venue: "Test Hall",
  capacity: 4,
  priceTiers: [
    { name: "General", price: 100, quantity: 2 },
    { name: "VIP", price: 500, quantity: 2 },
  ],
};

const setupEventWithHeldSeat = async () => {
  const organizerToken = await registerOrganizer();
  const attendee = await registerAttendee();

  const createRes = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${organizerToken}`)
    .send(eventPayload);
  const eventId = createRes.body.event._id;

  const seatsRes = await request(app).get(`/api/events/${eventId}/seats`);
  const seat = seatsRes.body.seats[0];

  await request(app)
    .post(`/api/events/${eventId}/seats/${seat._id}/hold`)
    .set("Authorization", `Bearer ${attendee.token}`);

  return { organizerToken, attendee, eventId, seat };
};

describe("POST /api/bookings (the transactional booking flow)", () => {
  it("books a held seat and issues a ticket with a signed QR token", async () => {
    const { attendee, eventId, seat } = await setupEventWithHeldSeat();

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });

    expect(res.statusCode).toBe(201);
    expect(res.body.booking.totalAmount).toBe(100); // General tier price
    expect(res.body.tickets).toHaveLength(1);

    const ticket = res.body.tickets[0];
    expect(ticket.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(ticket.qrToken).toBeDefined();

    // The QR token must be a signed, verifiable JWT - not a plain id
    const decoded = verifyTicketToken(ticket.qrToken);
    expect(decoded.ticketId).toBe(ticket._id);
    expect(decoded.eventId).toBe(eventId);
  });

  it("marks the seat as booked and increments the event's ticketsSold", async () => {
    const { attendee, eventId, seat } = await setupEventWithHeldSeat();

    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });

    const seatsRes = await request(app).get(`/api/events/${eventId}/seats`);
    const bookedSeat = seatsRes.body.seats.find((s) => s._id === seat._id);
    expect(bookedSeat.status).toBe("booked");

    const event = await Event.findById(eventId);
    expect(event.ticketsSold).toBe(1);
  });

  it("rejects booking a seat that isn't currently held by the requester", async () => {
    const organizerToken = await registerOrganizer();
    const attendee = await registerAttendee();

    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;
    const seatsRes = await request(app).get(`/api/events/${eventId}/seats`);
    const seat = seatsRes.body.seats[0]; // never held

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });

    expect(res.statusCode).toBe(409);
  });

  it("rejects booking a seat held by a different attendee", async () => {
    const { eventId, seat } = await setupEventWithHeldSeat(); // held by attendee@example.com
    const otherAttendee = await registerAttendee("other@example.com");

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${otherAttendee.token}`)
      .send({ eventId, seatIds: [seat._id] });

    expect(res.statusCode).toBe(409);
  });

  it("prevents double-booking the same seat on a repeat request", async () => {
    const { attendee, eventId, seat } = await setupEventWithHeldSeat();

    const first = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });
    expect(first.statusCode).toBe(201);

    const second = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });
    expect(second.statusCode).toBe(409);

    const event = await Event.findById(eventId);
    expect(event.ticketsSold).toBe(1); // not double-counted
  });

  it("rejects a request with no seatIds", async () => {
    const { attendee, eventId } = await setupEventWithHeldSeat();
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [] });
    expect(res.statusCode).toBe(400);
  });

  it("blocks an organizer from booking", async () => {
    const { organizerToken, eventId, seat } = await setupEventWithHeldSeat();
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ eventId, seatIds: [seat._id] });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/bookings/mine and /api/bookings/:id", () => {
  it("returns only the requesting attendee's own bookings", async () => {
    const { attendee, eventId, seat } = await setupEventWithHeldSeat();
    await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });

    const res = await request(app)
      .get("/api/bookings/mine")
      .set("Authorization", `Bearer ${attendee.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.bookings).toHaveLength(1);
  });

  it("blocks a different user from viewing someone else's booking", async () => {
    const { attendee, eventId, seat } = await setupEventWithHeldSeat();
    const bookingRes = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ eventId, seatIds: [seat._id] });

    const otherAttendee = await registerAttendee("other2@example.com");
    const res = await request(app)
      .get(`/api/bookings/${bookingRes.body.booking._id}`)
      .set("Authorization", `Bearer ${otherAttendee.token}`);

    expect(res.statusCode).toBe(403);
  });
});
