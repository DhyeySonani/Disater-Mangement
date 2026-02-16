import mongoose from "mongoose";

const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  capacity: { type: Number, default: 0 },
  currentOccupancy: { type: Number, default: 0 },
  contactPhone: String,
  facilities: [String], // e.g. ["Water", "Medical", "Food"]
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Shelter", shelterSchema);
