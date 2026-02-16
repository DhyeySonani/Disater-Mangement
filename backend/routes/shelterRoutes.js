import express from "express";
import Shelter from "../models/Shelter.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: get all active shelters (safe zone locator)
router.get("/", async (req, res) => {
  const shelters = await Shelter.find({ isActive: true });
  res.json(shelters);
});

// Admin: create shelter
router.post("/", protect, authorize("admin"), async (req, res) => {
  const shelter = await Shelter.create(req.body);
  res.json(shelter);
});

// Admin: update shelter
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  const shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(shelter);
});

// Admin: delete/deactivate shelter
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  await Shelter.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json({ message: "Shelter deactivated" });
});

export default router;
