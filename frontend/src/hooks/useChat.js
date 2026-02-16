import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import axios from "../api/axios";

export const useChat = (requestId, userId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!requestId) return;

        // Fetch existing messages
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/chat/${requestId}`);
                setMessages(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
                setLoading(false);
            }
        };

        fetchMessages();

        // Join chat room
        socket.emit("joinChatRoom", requestId);

        // Listen for new messages
        const handleNewMessage = (message) => {
            setMessages((prev) => [...prev, message]);

            // Mark as delivered if we're the receiver
            if (message.receiverId._id === userId) {
                socket.emit("messageDelivered", { messageId: message._id, requestId });
                setUnreadCount((prev) => prev + 1);
            }
        };

        // Listen for typing indicators
        const handleUserTyping = () => setTyping(true);
        const handleUserStoppedTyping = () => setTyping(false);

        // Listen for message status updates
        const handleStatusUpdate = ({ messageId, status }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, status } : msg
                )
            );
        };

        socket.on("receiveChatMessage", handleNewMessage);
        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);
        socket.on("messageStatusUpdate", handleStatusUpdate);

        return () => {
            socket.emit("leaveChatRoom", requestId);
            socket.off("receiveChatMessage", handleNewMessage);
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
            socket.off("messageStatusUpdate", handleStatusUpdate);
        };
    }, [requestId, userId]);

    const sendMessage = async (message) => {
        try {
            await axios.post(`/chat/${requestId}`, { message });
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    };

    const handleTyping = () => {
        socket.emit("typing", { requestId, userId });

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", { requestId, userId });
        }, 2000);
    };

    const clearUnread = () => setUnreadCount(0);

    return {
        messages,
        loading,
        typing,
        unreadCount,
        sendMessage,
        handleTyping,
        clearUnread
    };
};
