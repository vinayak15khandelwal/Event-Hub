import { Server } from "socket.io";

let io;

// Called once from index.js after the HTTP server is created.
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Per-event rooms - the brief requires seat events scoped per event,
    // never broadcast globally. A client joins the room for whichever
    // event's seat map it currently has open.
    socket.on("join-event", (eventId) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("leave-event", (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
};

// Returns null (rather than throwing) when called before initSocket runs -
// this lets controllers/tests run against the Express app in isolation
// (e.g. Supertest) without needing a live Socket.io server.
export const getIO = () => io || null;
