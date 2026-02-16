import express from "express";
import Message from "../models/Message.js";
import Request from "../models/Request.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware to verify user can access this chat
const verifyChatAccess = async (req, res, next) => {
    try {
        const { requestId } = req.params;
        const request = await Request.findById(requestId).populate("userId assignedVolunteer");

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        const userId = req.user.id;
        const isCitizen = request.userId?._id.toString() === userId;
        const isAssignedVolunteer = request.assignedVolunteer?._id.toString() === userId;

        if (!isCitizen && !isAssignedVolunteer) {
            return res.status(403).json({ message: "Access denied. You are not part of this conversation." });
        }

        req.request = request;
        next();
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/chat/:requestId - Get all messages for a request
router.get("/:requestId", protect, verifyChatAccess, async (req, res) => {
    try {
        const messages = await Message.find({ requestId: req.params.requestId })
            .populate("senderId", "name email")
            .populate("receiverId", "name email")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
});

// POST /api/chat/:requestId - Send a new message
router.post("/:requestId", protect, verifyChatAccess, async (req, res) => {
    try {
        const { message } = req.body;
        const { requestId } = req.params;
        const senderId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        // Determine receiver
        const isCitizen = req.request.userId._id.toString() === senderId;
        const receiverId = isCitizen
            ? req.request.assignedVolunteer._id
            : req.request.userId._id;

        const newMessage = await Message.create({
            senderId,
            receiverId,
            requestId,
            message: message.trim()
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "name email")
            .populate("receiverId", "name email");

        // Emit via Socket.io
        req.io.to(`chat_${requestId}`).emit("receiveChatMessage", populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
});

// PATCH /api/chat/message/:messageId/status - Update message status
router.patch("/message/:messageId/status", protect, async (req, res) => {
    try {
        const { status } = req.body;
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.receiverId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        message.status = status;
        await message.save();

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: "Failed to update status", error: error.message });
    }
});

export default router;
