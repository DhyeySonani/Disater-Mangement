import express from "express";
import Volunteer from "../models/Volunteer.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin: list all volunteers (users with role volunteer + volunteer profile)
router.get("/", protect, authorize("admin"), async (req, res) => {
  const volunteers = await Volunteer.find().populate("userId", "name email phone");
  res.json(volunteers);
});

// Volunteer: get my profile
router.get("/me", protect, authorize("volunteer"), async (req, res) => {
  let volunteer = await Volunteer.findOne({ userId: req.user.id }).populate("userId", "name email phone");
  if (!volunteer) {
    volunteer = await Volunteer.create({ userId: req.user.id });
    volunteer = await Volunteer.findById(volunteer._id).populate("userId", "name email phone");
  }
  res.json(volunteer);
});

// Volunteer: update my availability/skills
router.put("/me", protect, authorize("volunteer"), async (req, res) => {
  let volunteer = await Volunteer.findOne({ userId: req.user.id });
  if (!volunteer) volunteer = await Volunteer.create({ userId: req.user.id });
  const { availability, skills } = req.body;
  if (availability) volunteer.availability = availability;
  if (skills) volunteer.skills = skills;
  await volunteer.save();
  res.json(volunteer);
});

// Admin: create volunteer profile for a user (or auto-create on first /me)
// No extra route needed; volunteer registers with role volunteer and gets profile on first /me
export default router;
