import express from "express";
import Alert from "../models/Alert.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: get all alerts (landing, live updates)
router.get("/", async (req, res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 });
  res.json(alerts);
});

// Admin: create alert (broadcast via socket in server after create)
router.post("/", protect, authorize("admin"), async (req, res) => {
  const alert = await Alert.create({
    ...req.body,
    createdBy: req.user.id
  });
  if (req.io) req.io.emit("newAlert", alert);
  res.json(alert);
});

// Admin: update alert
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(alert);
});

// Admin: delete alert
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  await Alert.findByIdAndDelete(req.params.id);
  res.json({ message: "Alert deleted" });
});

export default router;
