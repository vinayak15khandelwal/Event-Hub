import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tierName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    // Signed JWT (see utils/qrToken.js) - encodes ticket id + event id + a
    // random jti so it can't be forged or replayed as a different ticket.
    // The brief requires the QR to encode a signed token, not a plain id.
    qrToken: { type: String, required: true, unique: true },
    qrCodeDataUrl: { type: String, required: true }, // base64 PNG, rendered once at issuance
    status: {
      type: String,
      enum: ["valid", "checked-in", "cancelled"],
      default: "valid",
    },
    checkedInAt: { type: Date, default: null }, // set on Day 7's check-in
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
