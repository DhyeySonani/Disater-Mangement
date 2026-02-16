import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  description: String,
  disasterType: String,
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"]
  },
  location: {
    lat: Number,
    lng: Number
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Assigned", "Resolved"],
    default: "Pending"
  },
  phone: String,
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Request", requestSchema);
