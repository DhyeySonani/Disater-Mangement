import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: {
    type: String,
    enum: ["citizen", "admin", "volunteer"],
    default: "citizen"
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
