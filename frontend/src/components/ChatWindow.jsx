import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";

export default function ChatWindow({ requestId, otherUser, onClose }) {
    const { user } = useAuth();
    const [inputMessage, setInputMessage] = useState("");
    const messagesEndRef = useRef(null);
    const { messages, loading, typing, sendMessage, handleTyping, clearUnread } = useChat(requestId, user?.id);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Clear unread when window opens
    useEffect(() => {
        clearUnread();
    }, [clearUnread]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        try {
            await sendMessage(inputMessage);
            setInputMessage("");
        } catch (error) {
            alert("Failed to send message");
        }
    };

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
        handleTyping();
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl p-8">
                    <p className="text-slate-600">Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-red-600 text-white rounded-t-2xl">
                    <div>
                        <h3 className="font-semibold text-lg">{otherUser?.name || "Chat"}</h3>
                        <p className="text-sm text-red-100">{otherUser?.email || ""}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-red-700 rounded-lg px-3 py-1 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {messages.length === 0 ? (
                        <p className="text-center text-slate-500 mt-8">No messages yet. Start the conversation!</p>
                    ) : (
                        messages.map((msg) => {
                            const isSender = msg.senderId._id === user?.id;
                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isSender
                                            ? "bg-red-600 text-white rounded-br-sm"
                                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                                            }`}
                                    >
                                        <p className="text-sm break-words">{msg.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className={`text-xs ${isSender ? "text-red-100" : "text-slate-400"}`}>
                                                {formatTime(msg.createdAt)}
                                            </p>
                                            {isSender && (
                                                <span className="text-xs text-red-100">
                                                    {msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {typing && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2">
                                <p className="text-sm text-slate-500 italic">typing...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t bg-white rounded-b-2xl">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim()}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
