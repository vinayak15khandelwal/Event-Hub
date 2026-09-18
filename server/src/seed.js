import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Seat from "./models/Seat.js";
import Booking from "./models/Booking.js";
import Ticket from "./models/Ticket.js";
import { buildSeatsForEvent } from "./utils/generateSeats.js";
import { signTicketToken } from "./utils/qrToken.js";
import { generateQrDataUrl } from "./utils/generateQrCode.js";

// Safety guard: this script wipes and rebuilds demo data. Refusing to run
// against a production database unless explicitly forced avoids the
// classic "ran the seed script against the wrong environment" disaster.
if (process.env.NODE_ENV === "production" && process.argv[2] !== "--force") {
  console.error(
    "Refusing to seed a production database. Pass --force if you really mean it."
  );
  process.exit(1);
}

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const ORGANIZERS = [
  { name: "Ananya Rao", email: "organizer1@demo.eventhub.dev", password: "demo1234" },
  { name: "Vikram Shah", email: "organizer2@demo.eventhub.dev", password: "demo1234" },
];

const ATTENDEES = [
  { name: "Priya Sharma", email: "attendee1@demo.eventhub.dev", password: "demo1234" },
  { name: "Amit Kumar", email: "attendee2@demo.eventhub.dev", password: "demo1234" },
  { name: "Sara Fernandes", email: "attendee3@demo.eventhub.dev", password: "demo1234" },
];

const EVENT_TEMPLATES = [
  {
    name: "React Summit Delhi",
    description: "A full day of talks on React 19, Server Components, and the modern frontend stack.",
    category: "web-dev",
    venue: "NSUT Auditorium, Delhi",
    daysOut: 14,
    capacity: 20,
    priceTiers: [
      { name: "General", price: 499, quantity: 15 },
      { name: "VIP", price: 1499, quantity: 5 },
    ],
  },
  {
    name: "AI/ML Builders Conference",
    description: "Hands-on sessions on LLM fine-tuning, RAG pipelines, and production ML systems.",
    category: "ai-ml",
    venue: "IIT Delhi Convention Centre",
    daysOut: 30,
    capacity: 16,
    priceTiers: [
      { name: "General", price: 799, quantity: 12 },
      { name: "VIP", price: 1999, quantity: 4 },
    ],
  },
  {
    name: "Cloud & DevOps Meetup",
    description: "Kubernetes at scale, GitOps workflows, and cost optimization on AWS/GCP/Azure.",
    category: "cloud-devops",
    venue: "91springboard, Connaught Place",
    daysOut: 7,
    capacity: 10,
    priceTiers: [{ name: "General", price: 299, quantity: 10 }],
  },
  {
    name: "Cybersecurity & CTF Night",
    description: "Live capture-the-flag challenges plus talks on real-world incident response.",
    category: "cybersecurity",
    venue: "Delhi Tech Hub, Gurugram",
    daysOut: 45,
    capacity: 8,
    priceTiers: [{ name: "General", price: 349, quantity: 8 }],
  },
];

const seed = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Seat.deleteMany({}),
    Booking.deleteMany({}),
    Ticket.deleteMany({}),
  ]);

  console.log("Creating users...");
  const organizers = await User.create(
    ORGANIZERS.map((o) => ({ ...o, role: "organizer" }))
  );
  const attendees = await User.create(
    ATTENDEES.map((a) => ({ ...a, role: "attendee" }))
  );

  console.log("Creating events + seats...");
  const events = [];
  for (let i = 0; i < EVENT_TEMPLATES.length; i++) {
    const template = EVENT_TEMPLATES[i];
    const organizer = organizers[i % organizers.length];
    const event = await Event.create({
      name: template.name,
      description: template.description,
      category: template.category,
      venue: template.venue,
      date: daysFromNow(template.daysOut),
      capacity: template.capacity,
      priceTiers: template.priceTiers,
      organizer: organizer._id,
    });
    const seats = await Seat.insertMany(buildSeatsForEvent(event));
    events.push({ event, seats, organizer });
  }

  console.log("Creating a few demo bookings so dashboards have real data...");
  // Book 2-3 seats on the first event so its organizer dashboard shows
  // non-zero revenue/attendees out of the box.
  const [firstEvent] = events;
  const seatsToBook = firstEvent.seats.slice(0, 3);
  const bookingAttendee = attendees[0];

  const bookedSeats = [];
  for (const seat of seatsToBook) {
    seat.status = "booked";
    await seat.save();
    bookedSeats.push(seat);
  }

  const totalAmount = bookedSeats.reduce((sum, s) => {
    const t = firstEvent.event.priceTiers.find((pt) => pt.name === s.tierName);
    return sum + (t ? t.price : 0);
  }, 0);

  const booking = await Booking.create({
    user: bookingAttendee._id,
    event: firstEvent.event._id,
    seats: bookedSeats.map((s) => s._id),
    totalAmount,
  });

  for (const seat of bookedSeats) {
    const ticketId = new mongoose.Types.ObjectId();
    const seatTier = firstEvent.event.priceTiers.find((t) => t.name === seat.tierName);
    const qrToken = signTicketToken(ticketId, firstEvent.event._id);
    const qrCodeDataUrl = await generateQrDataUrl(qrToken);
    await Ticket.create({
      _id: ticketId,
      booking: booking._id,
      event: firstEvent.event._id,
      seat: seat._id,
      user: bookingAttendee._id,
      tierName: seat.tierName,
      price: seatTier ? seatTier.price : 0,
      qrToken,
      qrCodeDataUrl,
    });
  }

  await Event.findByIdAndUpdate(firstEvent.event._id, {
    $inc: { ticketsSold: bookedSeats.length },
  });

  console.log("\nSeed complete.\n");
  console.log("Demo accounts (all passwords: demo1234):");
  ORGANIZERS.forEach((o) => console.log(`  organizer: ${o.email}`));
  ATTENDEES.forEach((a) => console.log(`  attendee:  ${a.email}`));
  console.log(`\nCreated ${events.length} events, 1 demo booking with ${bookedSeats.length} tickets.`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
