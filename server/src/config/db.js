import dns from "node:dns";
import mongoose from "mongoose";

// Some networks (notably certain Windows/router setups) can't complete the
// SRV/TXT DNS lookups that mongodb+srv:// depends on via Node's default
// resolver. Pointing at a public resolver fixes it without touching the
// connection string. See Day 1 troubleshooting notes in the README.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
