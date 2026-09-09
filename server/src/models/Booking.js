import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Mock payment - no real gateway integration, per the brief's "mock
    // payment step". Always "paid" once a booking document exists, since
    // creation and payment happen atomically in the same transaction.
    paymentStatus: {
      type: String,
      enum: ["paid", "refunded"],
      default: "paid",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
