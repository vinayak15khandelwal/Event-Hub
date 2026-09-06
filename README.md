# EventHub

Tech Conference & Event Management Platform — MERN stack. Built as Task 5 for the
Code A Nova Full Stack Development internship.

## Status: Day 1 — Monorepo Setup ✅

- [x] Vite + React + Tailwind frontend scaffolded
- [x] Express backend scaffolded
- [x] MongoDB Atlas connection wired up
- [x] Health-check route (`GET /api/health`) proving frontend ↔ backend ↔ DB
- [x] Auth system (Day 2)
- [ ] Event management (Day 3)
- [ ] Seat selection + real-time availability (Day 4)
- [ ] Ticket booking + QR generation (Day 5)
- [ ] Organizer dashboard (Day 6)
- [ ] QR check-in (Day 7)
- [ ] Attendee portal (Day 8)
- [ ] Testing + responsive audit (Day 9)
- [ ] Deployment + demo (Day 10)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Query |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas) + Mongoose |
| Auth | JWT + bcrypt, role claims |
| Real-time | Socket.io |
| QR | `qrcode` npm package |
| Testing | Jest + Supertest |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
eventhub/
├── client/          # React + Vite frontend
│   └── src/
│       ├── api/     # axios instance
│       ├── App.jsx
│       └── main.jsx
├── server/          # Express backend
│   └── src/
│       ├── config/       # db connection
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── __tests__/
│       ├── app.js        # express app (testable, no listen())
│       └── index.js      # server bootstrap + socket.io
├── package.json     # root convenience scripts
└── README.md
```

## Local Setup

### Prerequisites
- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone and install
```bash
git clone <your-repo-url>
cd eventhub
npm run install:all
```

### 2. Configure environment variables
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Fill in `server/.env` with your MongoDB Atlas connection string and JWT secrets.

### 3. Run both apps together
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

## Auth System (Day 2)

- **Registration**: `POST /api/auth/register` — role is selected client-side (attendee/organizer) but the server ignores anything outside that enum and defaults to `attendee`, so a client can never grant itself elevated access.
- **Login**: `POST /api/auth/login` — verifies against a bcrypt hash (10 salt rounds), never stores or logs plaintext.
- **Session**: JWT is set as an `httpOnly` cookie (not readable by JS, mitigates XSS token theft) and also returned in the response body for non-browser API clients.
- **`protect` middleware**: verifies the JWT server-side on every protected route and re-fetches the user from the DB (so a deleted user's old token stops working immediately).
- **`authorize(...roles)` middleware**: role guard used after `protect` — e.g. `router.post("/events", protect, authorize("organizer"), createEvent)`. This is the exact pattern Day 3's organizer-only event routes will use.
- **Client**: Zustand `authStore` calls `/api/auth/me` on load to restore session state (since the cookie itself isn't readable), plus `ProtectedRoute` for route-level guarding and role-based nav in `Navbar`.

## Data Model

_(documented incrementally as collections are added — see Day 3 onward)_

## Demo

_(5-minute walkthrough video link added on Day 10)_
