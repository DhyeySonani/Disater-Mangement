import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import adminRoutes from "./routes/admin.js";
import shelterRoutes from "./routes/shelterRoutes.js";
import emergencyContactRoutes from "./routes/emergencyContactRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/emergency-contacts", emergencyContactRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/chat", chatRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a chat room for a specific request
  socket.on("joinChatRoom", (requestId) => {
    socket.join(`chat_${requestId}`);
    console.log(`Socket ${socket.id} joined chat_${requestId}`);
  });

  // Leave a chat room
  socket.on("leaveChatRoom", (requestId) => {
    socket.leave(`chat_${requestId}`);
    console.log(`Socket ${socket.id} left chat_${requestId}`);
  });

  // Typing indicator
  socket.on("typing", ({ requestId, userId }) => {
    socket.to(`chat_${requestId}`).emit("userTyping", { userId });
  });

  socket.on("stopTyping", ({ requestId, userId }) => {
    socket.to(`chat_${requestId}`).emit("userStoppedTyping", { userId });
  });

  // Message delivery acknowledgment
  socket.on("messageDelivered", ({ messageId, requestId }) => {
    socket.to(`chat_${requestId}`).emit("messageStatusUpdate", { messageId, status: "delivered" });
  });

  // Legacy support for existing functionality
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
