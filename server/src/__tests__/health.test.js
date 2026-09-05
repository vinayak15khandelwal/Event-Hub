import request from "supertest";
import app from "../app.js";

describe("GET /api/health", () => {
  it("returns 200 and a success message", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
