import express from "express";
import Volunteer from "../models/Volunteer.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

const userFields = "name email phone isAvailable";

// Admin: list all volunteers (users with role volunteer + volunteer profile)
router.get("/", protect, authorize("admin"), async (req, res) => {
  const volunteers = await Volunteer.find().populate("userId", userFields);
  res.json(volunteers);
});

// Volunteer: get my profile
router.get("/me", protect, authorize("volunteer"), async (req, res) => {
  let volunteer = await Volunteer.findOne({ userId: req.user.id }).populate("userId", userFields);
  if (!volunteer) {
    volunteer = await Volunteer.create({ userId: req.user.id });
    volunteer = await Volunteer.findById(volunteer._id).populate("userId", userFields);
  }
  res.json(volunteer);
});

// Volunteer: update online/offline availability (real-time via Socket.io)
router.put("/me/availability", protect, authorize("volunteer"), async (req, res) => {
  const isAvailable = Boolean(req.body.isAvailable);
  await User.findByIdAndUpdate(req.user.id, { isAvailable });
  if (req.io) req.io.emit("volunteerAvailability", { userId: req.user.id, isAvailable });
  res.json({ isAvailable });
});

// Volunteer: update my availability/skills (legacy dropdown)
router.put("/me", protect, authorize("volunteer"), async (req, res) => {
  let volunteer = await Volunteer.findOne({ userId: req.user.id });
  if (!volunteer) volunteer = await Volunteer.create({ userId: req.user.id });
  const { availability, skills } = req.body;
  if (availability) volunteer.availability = availability;
  if (skills) volunteer.skills = skills;
  await volunteer.save();
  res.json(volunteer);
});

// Admin: remove volunteer (with 60s undo window)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });

  volunteer.pendingRemoval = true;
  volunteer.removalUndoExpiresAt = new Date(Date.now() + 60 * 1000);
  await volunteer.save();

  await User.findByIdAndUpdate(volunteer.userId, { role: "citizen", isAvailable: false });

  // Force logout for that volunteer if they are online
  if (req.io) req.io.emit("volunteerRemoved", { userId: volunteer.userId.toString() });

  res.json({ undoExpiresAt: volunteer.removalUndoExpiresAt, volunteerId: volunteer._id });
});

// Admin: undo remove volunteer within 60 seconds
router.put("/:id/undo-remove", protect, authorize("admin"), async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });

  if (!volunteer.pendingRemoval || !volunteer.removalUndoExpiresAt || Date.now() > new Date(volunteer.removalUndoExpiresAt).getTime()) {
    return res.status(400).json({ message: "Undo window expired" });
  }

  volunteer.pendingRemoval = false;
  volunteer.removalUndoExpiresAt = undefined;
  await volunteer.save();

  await User.findByIdAndUpdate(volunteer.userId, { role: "volunteer" });

  if (req.io) req.io.emit("volunteerRestored", { userId: volunteer.userId.toString() });

  const populated = await Volunteer.findById(volunteer._id).populate("userId", userFields);
  res.json(populated);
});

export default router;
