import jwt from "jsonwebtoken";
import crypto from "node:crypto";

// Signs a token for a specific ticket. A random jti makes each token unique
// even if somehow issued twice, and keeps the payload from being just a
// guessable ticket id - satisfies the brief's "signed token, not a plain
// booking ID" constraint. Uses QR_SECRET (separate from JWT_SECRET) so
// leaking one secret doesn't compromise the other token type.
export const signTicketToken = (ticketId, eventId) => {
  return jwt.sign(
    { ticketId: ticketId.toString(), eventId: eventId.toString(), jti: crypto.randomUUID() },
    process.env.QR_SECRET,
    { expiresIn: "180d" } // generous - conferences can be booked well in advance
  );
};

export const verifyTicketToken = (token) => {
  return jwt.verify(token, process.env.QR_SECRET); // throws if invalid/expired/tampered
};
