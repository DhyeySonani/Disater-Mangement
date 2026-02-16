import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  skills: [String], // e.g. ["First Aid", "Boating", "Search"]
  availability: { type: String, enum: ["Available", "Busy", "Offline"], default: "Offline" },
  assignedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Request" }]
}, { timestamps: true });

export default mongoose.model("Volunteer", volunteerSchema);
