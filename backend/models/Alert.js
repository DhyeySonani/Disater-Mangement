import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  title: String,
  message: String,
  disasterType: String,
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

export default mongoose.model("Alert", alertSchema);
