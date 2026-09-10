import { io } from "socket.io-client";

// One shared socket for the whole app - components join/leave event-specific
// rooms on it rather than each opening their own connection.
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: true,
  withCredentials: true,
});

export default socket;
