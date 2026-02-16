import express from "express";
import EmergencyContact from "../models/EmergencyContact.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: get all active emergency contacts (directory)
router.get("/", async (req, res) => {
  const contacts = await EmergencyContact.find({ isActive: true }).sort({ type: 1 });
  res.json(contacts);
});

// Admin: create contact
router.post("/", protect, authorize("admin"), async (req, res) => {
  const contact = await EmergencyContact.create(req.body);
  res.json(contact);
});

// Admin: update contact
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  const { name, phone, type, area, isActive } = req.body;
  const update = {
    ...(name !== undefined ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(area !== undefined ? { area } : {}),
    ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
  };
  const contact = await EmergencyContact.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(contact);
});

// Admin: delete contact
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  await EmergencyContact.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json({ message: "Contact deactivated" });
});

export default router;
