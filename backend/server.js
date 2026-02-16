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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.roomId).emit("receiveMessage", data);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
