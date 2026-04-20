// File: video-call-main/src/api/socket.ts

import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";

const SOCKET_URL = API_URL;

// 🔐 API KEY (same as backend .env)
const API_KEY = "ZATCHAT_PRATEEK9373";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["websocket"],

  // 🔥 IMPORTANT: Send API Key to backend
  auth: {
    apiKey: API_KEY,
  },
});

// ================= CONNECTION EVENTS =================

socket.on("connect", () => {
  console.log("✅ Socket Connected:", socket.id);

  const savedRoom = localStorage.getItem("selectedRoom");
  const savedUser = localStorage.getItem("chatUser");

  if (savedRoom && savedUser) {
    console.log("🔄 Auto-rejoining room:", savedRoom);
    socket.emit("join_room", savedRoom);
    socket.emit("user_join", { mobile: savedUser });
  }
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection Error:", error.message);
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`🔄 Reconnected after ${attemptNumber} attempts`);

  const savedRoom = localStorage.getItem("selectedRoom");
  const savedUser = localStorage.getItem("chatUser");

  if (savedRoom && savedUser) {
    console.log("🔄 Rejoining room after reconnect:", savedRoom);
    socket.emit("join_room", savedRoom);
    socket.emit("user_join", { mobile: savedUser });
  }
});

// Make socket available globally for debugging
if (typeof window !== "undefined") {
  (window as any).socket = socket;
}

export default socket;