import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Booking from "../models/Booking.js";
import Ticket from "../models/Ticket.js";
import Seat from "../models/Seat.js";

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

const registerAttendee = async (email, name = "Priya Sharma") => {
  const res = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "password123",
    role: "attendee",
  });
  return { token: res.body.token, userId: res.body.user.id };
};

const eventPayload = {
  name: "Dashboard Test Conf",
  category: "web-dev",
  date: daysFromNow(30),
  venue: "Test Hall",
  capacity: 4,
  priceTiers: [
    { name: "General", price: 100, quantity: 2 },
    { name: "VIP", price: 500, quantity: 2 },
  ],
};

// Seeds two "bookings" directly at the data layer (bypassing the
// transactional /api/bookings endpoint, which requires a replica set -
// this file runs against a standalone instance). Analytics/roster read
// logic is what's under test here, not the booking transaction itself
// (covered separately in bookings.test.js).
const seedBookingsForEvent = async (eventId, organizer) => {
  const seatsRes = await request(app).get(`/api/events/${eventId}/seats`);
  const generalSeat = seatsRes.body.seats.find((s) => s.tierName === "General");
  const vipSeat = seatsRes.body.seats.find((s) => s.tierName === "VIP");

  const attendee1 = await registerAttendee("attendee1@example.com", "Priya Sharma");
  const attendee2 = await registerAttendee("attendee2@example.com", "Amit Kumar");

  await Seat.updateMany(
    { _id: { $in: [generalSeat._id, vipSeat._id] } },
    { status: "booked", heldBy: null, holdExpiresAt: null }
  );

  const booking1 = await Booking.create({
    user: attendee1.userId,
    event: eventId,
    seats: [generalSeat._id],
    totalAmount: 100,
  });
  await Ticket.create({
    booking: booking1._id,
    event: eventId,
    seat: generalSeat._id,
    user: attendee1.userId,
    tierName: "General",
    price: 100,
    qrToken: "fake-token-1",
    qrCodeDataUrl: "data:image/png;base64,fake1",
  });

  const booking2 = await Booking.create({
    user: attendee2.userId,
    event: eventId,
    seats: [vipSeat._id],
    totalAmount: 500,
  });
  await Ticket.create({
    booking: booking2._id,
    event: eventId,
    seat: vipSeat._id,
    user: attendee2.userId,
    tierName: "VIP",
    price: 500,
    qrToken: "fake-token-2",
    qrCodeDataUrl: "data:image/png;base64,fake2",
  });

  return { attendee1, attendee2 };
};

describe("GET /api/events/:eventId/dashboard/analytics", () => {
  it("computes revenue, sold percentage, and per-tier breakdown from real tickets", async () => {
    const organizer = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;

    await seedBookingsForEvent(eventId, organizer);

    const res = await request(app)
      .get(`/api/events/${eventId}/dashboard/analytics`)
      .set("Authorization", `Bearer ${organizer.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.analytics.totalRevenue).toBe(600);
    expect(res.body.analytics.ticketsSold).toBe(2);
    expect(res.body.analytics.soldPercentage).toBe(50); // 2 of 4
    expect(res.body.analytics.bookingsCount).toBe(2);

    const general = res.body.analytics.revenueByTier.find((t) => t.tierName === "General");
    const vip = res.body.analytics.revenueByTier.find((t) => t.tierName === "VIP");
    expect(general).toMatchObject({ revenue: 100, ticketsSold: 1 });
    expect(vip).toMatchObject({ revenue: 500, ticketsSold: 1 });
  });

  it("blocks an attendee from viewing analytics", async () => {
    const organizer = await registerOrganizer();
    const attendee = await registerAttendee("attendee@example.com");
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);

    const res = await request(app)
      .get(`/api/events/${createRes.body.event._id}/dashboard/analytics`)
      .set("Authorization", `Bearer ${attendee.token}`);

    expect(res.statusCode).toBe(403);
  });

  it("blocks a different organizer from viewing someone else's event analytics", async () => {
    const owner = await registerOrganizer("owner@example.com");
    const other = await registerOrganizer("other@example.com");
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(eventPayload);

    const res = await request(app)
      .get(`/api/events/${createRes.body.event._id}/dashboard/analytics`)
      .set("Authorization", `Bearer ${other.token}`);

    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/events/:eventId/dashboard/attendees", () => {
  it("returns the attendee roster as JSON by default", async () => {
    const organizer = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;
    await seedBookingsForEvent(eventId, organizer);

    const res = await request(app)
      .get(`/api/events/${eventId}/dashboard/attendees`)
      .set("Authorization", `Bearer ${organizer.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.attendees).toHaveLength(2);
    expect(res.body.attendees.map((a) => a.name).sort()).toEqual([
      "Amit Kumar",
      "Priya Sharma",
    ]);
  });

  it("returns a CSV file when format=csv is requested", async () => {
    const organizer = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;
    await seedBookingsForEvent(eventId, organizer);

    const res = await request(app)
      .get(`/api/events/${eventId}/dashboard/attendees?format=csv`)
      .set("Authorization", `Bearer ${organizer.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("Name,Email,Seat,Tier,Price,Booked At");
    expect(res.text).toContain("Priya Sharma");
    expect(res.text).toContain("Amit Kumar");
  });
});

describe("Announcements", () => {
  it("lets the owning organizer send an announcement", async () => {
    const organizer = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;

    const res = await request(app)
      .post(`/api/events/${eventId}/announcements`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ subject: "Venue change", message: "We moved to Hall B." });

    expect(res.statusCode).toBe(201);
    expect(res.body.announcement.subject).toBe("Venue change");
  });

  it("lets a ticket-holding attendee read announcements", async () => {
    const organizer = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;
    const { attendee1 } = await seedBookingsForEvent(eventId, organizer);

    await request(app)
      .post(`/api/events/${eventId}/announcements`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ subject: "Reminder", message: "Doors open at 9am." });

    const res = await request(app)
      .get(`/api/events/${eventId}/announcements`)
      .set("Authorization", `Bearer ${attendee1.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.announcements).toHaveLength(1);
  });

  it("blocks an attendee with no ticket for this event from reading announcements", async () => {
    const organizer = await registerOrganizer();
    const outsider = await registerAttendee("outsider@example.com");
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizer.token}`)
      .send(eventPayload);
    const eventId = createRes.body.event._id;

    await request(app)
      .post(`/api/events/${eventId}/announcements`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ subject: "Reminder", message: "Doors open at 9am." });

    const res = await request(app)
      .get(`/api/events/${eventId}/announcements`)
      .set("Authorization", `Bearer ${outsider.token}`);

    expect(res.statusCode).toBe(403);
  });

  it("blocks a non-owning organizer from sending an announcement", async () => {
    const owner = await registerOrganizer("owner2@example.com");
    const other = await registerOrganizer("other2@example.com");
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(eventPayload);

    const res = await request(app)
      .post(`/api/events/${createRes.body.event._id}/announcements`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ subject: "Hijack", message: "Not allowed" });

    expect(res.statusCode).toBe(403);
  });
});
