import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Seat from "../models/Seat.js";
import { expireStaleHolds } from "../utils/seatHoldSweeper.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_jest_only";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

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
  return res.body.token;
};

const registerAttendee = async (email = "attendee@example.com") => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Priya Sharma",
    email,
    password: "password123",
    role: "attendee",
  });
  return res.body.token;
};

// Small 4-seat event (2 tiers x 2) so seat generation is easy to assert on
const smallEventPayload = {
  name: "Small Test Conf",
  category: "web-dev",
  date: daysFromNow(30),
  venue: "Test Hall",
  capacity: 4,
  priceTiers: [
    { name: "General", price: 100, quantity: 2 },
    { name: "VIP", price: 500, quantity: 2 },
  ],
};

const createEventAndGetSeats = async (organizerToken) => {
  const createRes = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${organizerToken}`)
    .send(smallEventPayload);
  const eventId = createRes.body.event._id;

  const seatsRes = await request(app).get(`/api/events/${eventId}/seats`);
  return { eventId, seats: seatsRes.body.seats };
};

describe("Seat generation on event creation", () => {
  it("creates exactly one seat per unit of price-tier quantity", async () => {
    const organizerToken = await registerOrganizer();
    const { seats } = await createEventAndGetSeats(organizerToken);

    expect(seats).toHaveLength(4);
    expect(seats.every((s) => s.status === "available")).toBe(true);
    expect(seats.filter((s) => s.tierName === "General")).toHaveLength(2);
    expect(seats.filter((s) => s.tierName === "VIP")).toHaveLength(2);
  });

  it("rejects an event whose price tier quantities don't sum to capacity", async () => {
    const organizerToken = await registerOrganizer();
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ ...smallEventPayload, capacity: 10 }); // tiers still sum to 4

    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/events/:eventId/seats/:seatId/hold", () => {
  it("lets an attendee hold an available seat", async () => {
    const organizerToken = await registerOrganizer();
    const attendeeToken = await registerAttendee();
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    const res = await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.seat.status).toBe("held");
    expect(res.body.seat.holdExpiresAt).toBeDefined();
  });

  it("returns 409 when two attendees race for the same seat", async () => {
    const organizerToken = await registerOrganizer();
    const attendee1 = await registerAttendee("a1@example.com");
    const attendee2 = await registerAttendee("a2@example.com");
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    const first = await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendee1}`);
    const second = await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendee2}`);

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(409);
  });

  it("blocks an organizer from holding a seat", async () => {
    const organizerToken = await registerOrganizer();
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    const res = await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/events/:eventId/seats/:seatId/release", () => {
  it("lets the holder release their own hold", async () => {
    const organizerToken = await registerOrganizer();
    const attendeeToken = await registerAttendee();
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendeeToken}`);

    const res = await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/release`)
      .set("Authorization", `Bearer ${attendeeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.seat.status).toBe("available");
  });

  it("blocks releasing a seat you don't hold", async () => {
    const organizerToken = await registerOrganizer();
    const attendee1 = await registerAttendee("a1@example.com");
    const attendee2 = await registerAttendee("a2@example.com");
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendee1}`);

    const res = await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/release`)
      .set("Authorization", `Bearer ${attendee2}`);

    expect(res.statusCode).toBe(400);
  });
});

describe("expireStaleHolds (the 2-minute auto-expiry sweep)", () => {
  it("releases a seat whose hold has passed its expiry time", async () => {
    const organizerToken = await registerOrganizer();
    const attendeeToken = await registerAttendee();
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendeeToken}`);

    // Simulate time passing: back-date the hold's expiry instead of
    // waiting 2 real minutes in the test suite.
    await Seat.findByIdAndUpdate(seats[0]._id, {
      holdExpiresAt: new Date(Date.now() - 1000),
    });

    await expireStaleHolds();

    const seatAfter = await Seat.findById(seats[0]._id);
    expect(seatAfter.status).toBe("available");
    expect(seatAfter.heldBy).toBeNull();
  });

  it("leaves non-expired holds untouched", async () => {
    const organizerToken = await registerOrganizer();
    const attendeeToken = await registerAttendee();
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendeeToken}`);

    await expireStaleHolds();

    const seatAfter = await Seat.findById(seats[0]._id);
    expect(seatAfter.status).toBe("held");
  });
});

describe("Event update guard on locked-in seats", () => {
  it("blocks capacity changes once a seat is held", async () => {
    const organizerToken = await registerOrganizer();
    const attendeeToken = await registerAttendee();
    const { eventId, seats } = await createEventAndGetSeats(organizerToken);

    await request(app)
      .post(`/api/events/${eventId}/seats/${seats[0]._id}/hold`)
      .set("Authorization", `Bearer ${attendeeToken}`);

    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ capacity: 6, priceTiers: smallEventPayload.priceTiers });

    expect(res.statusCode).toBe(400);
  });

  it("allows capacity changes and regenerates seats when none are held", async () => {
    const organizerToken = await registerOrganizer();
    const { eventId } = await createEventAndGetSeats(organizerToken);

    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        capacity: 6,
        priceTiers: [{ name: "General", price: 100, quantity: 6 }],
      });

    expect(res.statusCode).toBe(200);

    const seatsRes = await request(app).get(`/api/events/${eventId}/seats`);
    expect(seatsRes.body.seats).toHaveLength(6);
  });
});

describe("Event deletion cascades to seats", () => {
  it("removes all seats when the event is deleted", async () => {
    const organizerToken = await registerOrganizer();
    const { eventId } = await createEventAndGetSeats(organizerToken);

    await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    const remaining = await Seat.find({ event: eventId });
    expect(remaining).toHaveLength(0);
  });
});
