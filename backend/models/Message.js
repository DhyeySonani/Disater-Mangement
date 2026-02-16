import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    }
}, { timestamps: true });

// Index for efficient queries
messageSchema.index({ requestId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
