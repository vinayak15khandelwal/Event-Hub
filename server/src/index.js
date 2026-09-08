import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";
import { startSeatHoldSweeper } from "./utils/seatHoldSweeper.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`EventHub server running on port ${PORT}`);
    // Periodically releases seat holds past their 2-minute expiry and
    // notifies the affected event rooms in real time (Day 4 requirement).
    startSeatHoldSweeper();
  });
};

start();
