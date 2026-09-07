import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";

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

const registerOrganizer = async (overrides = {}) => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Rahul Verma",
    email: overrides.email || "rahul@example.com",
    password: "password123",
    role: "organizer",
  });
  return res.body.token;
};

const registerAttendee = async () => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Priya Sharma",
    email: "priya@example.com",
    password: "password123",
    role: "attendee",
  });
  return res.body.token;
};

const validEventPayload = (overrides = {}) => ({
  name: "React Summit India",
  description: "A conference for React developers",
  category: "web-dev",
  date: daysFromNow(30),
  venue: "NSUT Auditorium, Delhi",
  capacity: 200,
  priceTiers: [
    { name: "General", price: 499, quantity: 150 },
    { name: "VIP", price: 1499, quantity: 50 },
  ],
  ...overrides,
});

describe("POST /api/events (create)", () => {
  it("allows an organizer to create an event", async () => {
    const token = await registerOrganizer();
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload());

    expect(res.statusCode).toBe(201);
    expect(res.body.event.name).toBe("React Summit India");
    expect(res.body.event.organizer).toBeDefined();
    expect(res.body.event.priceTiers).toHaveLength(2);
  });

  it("rejects an attendee trying to create an event", async () => {
    const token = await registerAttendee();
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload());

    expect(res.statusCode).toBe(403);
  });

  it("rejects a request with no auth token", async () => {
    const res = await request(app).post("/api/events").send(validEventPayload());
    expect(res.statusCode).toBe(401);
  });

  it("rejects an event date in the past", async () => {
    const token = await registerOrganizer();
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ date: daysFromNow(-1) }));

    expect(res.statusCode).toBe(400);
  });

  it("rejects an event with capacity below 1", async () => {
    const token = await registerOrganizer();
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ capacity: 0 }));

    expect(res.statusCode).toBe(400);
  });

  it("rejects an event with no price tiers", async () => {
    const token = await registerOrganizer();
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ priceTiers: [] }));

    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/events (listing + filters)", () => {
  it("lists published events, publicly, with pagination metadata", async () => {
    const token = await registerOrganizer();
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload());

    const res = await request(app).get("/api/events");
    expect(res.statusCode).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it("filters by category", async () => {
    const token = await registerOrganizer();
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ category: "web-dev" }));
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ name: "AI Summit", category: "ai-ml" }));

    const res = await request(app).get("/api/events").query({ category: "ai-ml" });
    expect(res.statusCode).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].category).toBe("ai-ml");
  });

  it("filters by date range", async () => {
    const token = await registerOrganizer();
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ name: "Near event", date: daysFromNow(5) }));
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload({ name: "Far event", date: daysFromNow(90) }));

    const res = await request(app)
      .get("/api/events")
      .query({ to: daysFromNow(10).toISOString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].name).toBe("Near event");
  });
});

describe("GET /api/events/:id", () => {
  it("returns 404 for a non-existent event", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/events/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /api/events/:id (update, owner-only)", () => {
  it("allows the owning organizer to update their event", async () => {
    const token = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload());

    const res = await request(app)
      .put(`/api/events/${createRes.body.event._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ venue: "Updated Venue" });

    expect(res.statusCode).toBe(200);
    expect(res.body.event.venue).toBe("Updated Venue");
  });

  it("blocks a different organizer from updating someone else's event", async () => {
    const ownerToken = await registerOrganizer({ email: "owner@example.com" });
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(validEventPayload());

    const otherToken = await registerOrganizer({ email: "other@example.com" });
    const res = await request(app)
      .put(`/api/events/${createRes.body.event._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ venue: "Hijacked Venue" });

    expect(res.statusCode).toBe(403);
  });
});

describe("DELETE /api/events/:id (owner-only)", () => {
  it("allows the owning organizer to delete their event", async () => {
    const token = await registerOrganizer();
    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload());

    const res = await request(app)
      .delete(`/api/events/${createRes.body.event._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const getRes = await request(app).get(`/api/events/${createRes.body.event._id}`);
    expect(getRes.statusCode).toBe(404);
  });
});

describe("GET /api/events/mine/list", () => {
  it("returns only the requesting organizer's events, including drafts", async () => {
    const token = await registerOrganizer();
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(validEventPayload());

    const otherToken = await registerOrganizer({ email: "other2@example.com" });
    await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${otherToken}`)
      .send(validEventPayload({ name: "Someone else's event" }));

    const res = await request(app)
      .get("/api/events/mine/list")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].name).toBe("React Summit India");
  });
});
