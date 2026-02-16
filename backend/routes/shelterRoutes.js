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
  const { name, address, location, capacity, contactPhone, facilities } = req.body;
  const shelter = await Shelter.create({
    name,
    address,
    location: location && (Number.isFinite(location.lat) || Number.isFinite(location.lng))
      ? { lat: Number(location.lat) || 0, lng: Number(location.lng) || 0 }
      : { lat: 0, lng: 0 },
    capacity: Number(capacity) || 0,
    contactPhone: contactPhone || undefined,
    facilities: Array.isArray(facilities) ? facilities : []
  });
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
