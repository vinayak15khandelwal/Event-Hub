import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    tierName: {
      type: String,
      required: true,
    },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    label: {
      type: String,
      required: true, // e.g. "R1S1" (Row 1, Seat 1)
    },
    status: {
      type: String,
      enum: ["available", "held", "booked"],
      default: "available",
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    holdExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One label per event (not globally) - two different events can both have "R1S1"
seatSchema.index({ event: 1, label: 1 }, { unique: true });
// The hold-sweeper's core query: find held seats whose time is up
seatSchema.index({ status: 1, holdExpiresAt: 1 });

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;
