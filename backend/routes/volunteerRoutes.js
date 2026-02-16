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

// Admin: remove volunteer (delete Volunteer profile, set User role to citizen)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });
  const userId = volunteer.userId;
  await Volunteer.findByIdAndDelete(req.params.id);
  await User.findByIdAndUpdate(userId, { role: "citizen", isAvailable: false });
  if (req.io) req.io.emit("volunteerRemoved", { userId: userId.toString() });
  res.json({ message: "Volunteer removed" });
});

export default router;
