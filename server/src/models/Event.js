import mongoose from "mongoose";

const priceTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "General", "VIP"
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "web-dev",
        "ai-ml",
        "cloud-devops",
        "mobile",
        "cybersecurity",
        "design",
        "startup",
        "other",
      ],
      default: "other",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      validate: {
        validator: (value) => value > new Date(),
        message: "Event date must be in the future",
      },
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
      maxlength: 200,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    priceTiers: {
      type: [priceTierSchema],
      validate: {
        validator: (tiers) => Array.isArray(tiers) && tiers.length > 0,
        message: "At least one price tier is required",
      },
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "published",
    },
    // Aggregate counters kept in sync by the booking flow (Day 4/5).
    // Not authoritative for seat-level availability - that's the Seat
    // collection introduced in Day 4. This is for fast list/card display.
    ticketsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Seat generation (Day 4) needs a deterministic 1:1 mapping between price
// tiers and physical seats, so tier quantities must add up to capacity.
eventSchema.pre("validate", function (next) {
  if (this.priceTiers && this.priceTiers.length > 0 && this.capacity !== undefined) {
    const total = this.priceTiers.reduce((sum, t) => sum + (t.quantity || 0), 0);
    if (total !== this.capacity) {
      const err = new Error(
        `Sum of price tier quantities (${total}) must equal capacity (${this.capacity})`
      );
      err.statusCode = 400;
      return next(err);
    }
  }
  next();
});

// Supports the "search" filter (event listing with filters, Day 3)
eventSchema.index({ name: "text", venue: "text" });
// Supports category + date-range filters without a full collection scan
eventSchema.index({ category: 1, date: 1 });

eventSchema.virtual("seatsRemaining").get(function () {
  return Math.max(this.capacity - this.ticketsSold, 0);
});
eventSchema.set("toJSON", { virtuals: true });

const Event = mongoose.model("Event", eventSchema);

export default Event;
