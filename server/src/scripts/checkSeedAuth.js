// Safe diagnostic: checks the seeded users against the live database using
// the same bcrypt.compare() the login flow uses. Prints booleans only -
// never the password and never any part of a hash.
//
// Run:  cd server && node src/scripts/checkSeedAuth.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const SEED_PASSWORD = "demo1234"; // the value declared in seed.js
const EMAILS = [
  "organizer1@demo.eventhub.dev",
  "organizer2@demo.eventhub.dev",
  "attendee1@demo.eventhub.dev",
  "attendee2@demo.eventhub.dev",
  "attendee3@demo.eventhub.dev",
];

const BCRYPT_FORMAT = /^\$2[aby]\$\d{2}\$.{53}$/;

await connectDB();
console.log("connected database name:", mongoose.connection.name);
console.log("connected host:", mongoose.connection.host);
console.log("NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("total users in this database:", await User.countDocuments());

const rows = [];
for (const email of EMAILS) {
  const user = await User.findOne({ email }).select("+password");
  const hasPassword = Boolean(user?.password);
  const validFormat = hasPassword && BCRYPT_FORMAT.test(user.password);
  const compare = validFormat ? await bcrypt.compare(SEED_PASSWORD, user.password) : false;
  rows.push({
    email,
    userFound: Boolean(user),
    passwordFieldExists: hasPassword,
    bcryptFormatValid: validFormat,
    compareResult: compare,
  });
}
console.table(rows);

// Any demo-looking emails that differ from what seed.js declares
// (case/whitespace/typo) would show up here.
const similar = await User.find({ email: /demo\.eventhub/i }).select("email role");
console.log("emails containing 'demo.eventhub':", similar.map((u) => `${u.email} (${u.role})`));

await mongoose.disconnect();
process.exit(0);
