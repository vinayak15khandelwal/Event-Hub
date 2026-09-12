import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Ticket from "../models/Ticket.js";
import { signTicketToken } from "../utils/qrToken.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_jest_only";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.QR_SECRET = process.env.QR_SECRET || "test_qr_secret_for_jest_only";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
  return { token: res.body.token, userId: res.body.user.id };
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
  name: "Checkin Test Conf",
  category: "web-dev",
  date: daysFromNow(30),
  venue: "Test Hall",
  capacity: 2,
  priceTiers: [{ name: "General", price: 100, quantity: 2 }],
};

const createEvent = async (organizerToken) => {
  const res = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${organizerToken}`)
    .send(eventPayload);
  return res.body.event._id;
};

// Creates a Ticket directly at the data layer (bypassing the transactional
// booking endpoint, which needs a replica set - this file runs standalone).
// Check-in logic only touches a single Ticket document, so no transaction
// is needed here either way.
const seedTicket = async (eventId, attendeeUserId, overrides = {}) => {
  const ticketId = new mongoose.Types.ObjectId();
  const qrToken = signTicketToken(ticketId, eventId);
  const ticket = await Ticket.create({
    _id: ticketId,
    booking: new mongoose.Types.ObjectId(),
    event: eventId,
    seat: new mongoose.Types.ObjectId(),
    user: attendeeUserId,
    tierName: "General",
    price: 100,
    qrToken,
    qrCodeDataUrl: "data:image/png;base64,fake",
    ...overrides,
  });
  return { ticket, qrToken };
};

describe("POST /api/events/:eventId/checkin", () => {
  it("checks in a valid ticket", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventId = await createEvent(organizer.token);
    const { qrToken } = await seedTicket(eventId, attendee.userId);

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: qrToken });

    expect(res.statusCode).toBe(200);
    expect(res.body.ticket.status).toBe("checked-in");
    expect(res.body.checkedInCount).toBe(1);
    expect(res.body.totalTickets).toBe(1);
  });

  it("rejects checking the same ticket in twice", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventId = await createEvent(organizer.token);
    const { qrToken } = await seedTicket(eventId, attendee.userId);

    await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: qrToken });

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: qrToken });

    expect(res.statusCode).toBe(409);
  });

  it("rejects a cancelled ticket", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventId = await createEvent(organizer.token);
    const { qrToken } = await seedTicket(eventId, attendee.userId, { status: "cancelled" });

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: qrToken });

    expect(res.statusCode).toBe(400);
  });

  it("rejects a tampered/invalid token, and does not report it as merely expired", async () => {
    const organizer = await registerOrganizer();
    const eventId = await createEvent(organizer.token);

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: "not.a.validtoken" });

    expect(res.statusCode).toBe(400);
    // Regression guard: a malformed token must not be conflated with a
    // genuinely expired one - these are different problems with different
    // fixes, and reporting them identically makes the real cause
    // undiagnosable from the client side.
    expect(res.body.message.toLowerCase()).not.toContain("expired");
  });

  it("reports a genuinely expired token as expired, distinctly from a malformed one", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventId = await createEvent(organizer.token);
    const ticketId = new mongoose.Types.ObjectId();

    // Crafted directly with jwt.sign (bypassing signTicketToken's fixed
    // 180-day expiry) to deterministically produce an already-expired
    // token, rather than waiting on real time.
    const expiredToken = jwt.sign(
      { ticketId: ticketId.toString(), eventId: eventId.toString(), jti: "test-jti" },
      process.env.QR_SECRET,
      { expiresIn: "-10s" }
    );
    await Ticket.create({
      _id: ticketId,
      booking: new mongoose.Types.ObjectId(),
      event: eventId,
      seat: new mongoose.Types.ObjectId(),
      user: attendee.userId,
      tierName: "General",
      price: 100,
      qrToken: expiredToken,
      qrCodeDataUrl: "data:image/png;base64,fake",
    });

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: expiredToken });

    expect(res.statusCode).toBe(400);
    expect(res.body.message.toLowerCase()).toContain("expired");
  });

  it("rejects a token issued for a different event", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventA = await createEvent(organizer.token);
    const eventB = await createEvent(organizer.token);
    const { qrToken } = await seedTicket(eventA, attendee.userId);

    const res = await request(app)
      .post(`/api/events/${eventB}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: qrToken });

    expect(res.statusCode).toBe(400);
  });

  it("blocks a non-owning organizer from checking in tickets", async () => {
    const owner = await registerOrganizer("owner@example.com");
    const other = await registerOrganizer("other@example.com");
    const attendee = await registerAttendee();
    const eventId = await createEvent(owner.token);
    const { qrToken } = await seedTicket(eventId, attendee.userId);

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ token: qrToken });

    expect(res.statusCode).toBe(403);
  });

  it("blocks an attendee from checking tickets in", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventId = await createEvent(organizer.token);
    const { qrToken } = await seedTicket(eventId, attendee.userId);

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${attendee.token}`)
      .send({ token: qrToken });

    expect(res.statusCode).toBe(403);
  });

  it("rejects a missing token", async () => {
    const organizer = await registerOrganizer();
    const eventId = await createEvent(organizer.token);

    const res = await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/events/:eventId/checkin/stats", () => {
  it("reports correct checked-in vs total counts", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee();
    const eventId = await createEvent(organizer.token);
    const t1 = await seedTicket(eventId, attendee.userId);
    await seedTicket(eventId, attendee.userId);
    await seedTicket(eventId, attendee.userId, { status: "cancelled" });

    await request(app)
      .post(`/api/events/${eventId}/checkin`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ token: t1.qrToken });

    const res = await request(app)
      .get(`/api/events/${eventId}/checkin/stats`)
      .set("Authorization", `Bearer ${organizer.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.checkedInCount).toBe(1);
    expect(res.body.totalTickets).toBe(2); // cancelled ticket excluded
  });
});
