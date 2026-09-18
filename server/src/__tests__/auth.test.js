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
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // keep each test isolated
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const attendeePayload = {
  name: "Priya Sharma",
  email: "priya@example.com",
  password: "password123",
  role: "attendee",
};

const organizerPayload = {
  name: "Rahul Verma",
  email: "rahul@example.com",
  password: "password123",
  role: "organizer",
};

describe("POST /api/auth/register", () => {
  it("registers a new attendee and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send(attendeePayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe("attendee");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.token).toBeDefined();
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(attendeePayload);
    const res = await request(app).post("/api/auth/register").send(attendeePayload);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("never trusts an arbitrary role string from the client", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...attendeePayload, role: "super-admin" });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe("attendee"); // falls back safely
  });

  it("rejects a password shorter than the schema's minimum length", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...attendeePayload, password: "abc" });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(attendeePayload);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: attendeePayload.email, password: attendeePayload.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects an incorrect password", async () => {
    await request(app).post("/api/auth/register").send(attendeePayload);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: attendeePayload.email, password: "wrongpassword" });
    expect(res.statusCode).toBe(401);
  });
});

describe("Protected routes", () => {
  it("blocks /api/auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("allows /api/auth/me with a valid token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(attendeePayload);
    const { token } = registerRes.body;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(attendeePayload.email);
  });
});

describe("Role-based guard (authorize middleware)", () => {
  const samplePayload = {
    name: "Sample Conf",
    category: "web-dev",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    venue: "Test Hall",
    capacity: 100,
    priceTiers: [{ name: "General", price: 500, quantity: 100 }],
  };

  it("blocks an attendee from an organizer-only route", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(attendeePayload);
    const { token } = registerRes.body;

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(samplePayload);

    expect(res.statusCode).toBe(403);
  });

  it("allows an organizer through the organizer-only route", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(organizerPayload);
    const { token } = registerRes.body;

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send(samplePayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.event.organizer).toBeDefined();
  });
});
