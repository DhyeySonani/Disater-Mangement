import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "Police", "Fire", "Ambulance", "NDRF", "Helpline"
  area: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("EmergencyContact", emergencyContactSchema);
