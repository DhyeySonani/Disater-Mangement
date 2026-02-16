import express from "express";
import Request from "../models/Request.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Citizen: submit emergency request (SOS) — broadcast for rescue map
router.post("/", protect, authorize("citizen"), async (req, res) => {
  const request = await Request.create({
    ...req.body,
    userId: req.user.id
  });
  const populated = await Request.findById(request._id)
    .populate("userId", "name phone");
  if (req.io) req.io.emit("newRescueRequest", populated);
  res.json(request);
});

// Citizen: get my own requests
router.get("/my", protect, authorize("citizen"), async (req, res) => {
  const requests = await Request.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate("assignedVolunteer", "name email phone");
  res.json(requests);
});

// Admin: get all requests (for approval & assignment)
router.get("/", protect, authorize("admin"), async (req, res) => {
  const requests = await Request.find()
    .populate("userId", "name email phone")
    .populate("assignedVolunteer", "name email phone")
    .sort({ createdAt: -1 });
  res.json(requests);
});

// Volunteer: get my assigned requests
router.get("/assigned-to-me", protect, authorize("volunteer"), async (req, res) => {
  const requests = await Request.find({ assignedVolunteer: req.user.id })
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });
  res.json(requests);
});

// Admin: approve request
router.put("/approve/:id", protect, authorize("admin"), async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  request.status = "Approved";
  await request.save();
  res.json(request);
});

// Admin: assign volunteer to request
router.put("/assign/:id", protect, authorize("admin"), async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  request.assignedVolunteer = req.body.volunteerId;
  request.status = "Assigned";
  request.assignedAt = new Date();
  request.assignmentUndoExpiresAt = new Date(Date.now() + 60 * 1000);
  await request.save();
  const populated = await Request.findById(request._id)
    .populate("userId", "name email phone")
    .populate("assignedVolunteer", "name email phone");
  res.json(populated);
});

// Admin: undo assignment within 60 seconds
router.put("/undo-assign/:id", protect, authorize("admin"), async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });

  if (!request.assignmentUndoExpiresAt || Date.now() > new Date(request.assignmentUndoExpiresAt).getTime()) {
    return res.status(400).json({ message: "Undo window expired" });
  }

  request.assignedVolunteer = undefined;
  request.status = "Pending";
  request.assignedAt = undefined;
  request.assignmentUndoExpiresAt = undefined;
  await request.save();

  const populated = await Request.findById(request._id)
    .populate("userId", "name email phone")
    .populate("assignedVolunteer", "name email phone");
  res.json(populated);
});

// Volunteer: update request status (e.g. Resolved)
router.put("/status/:id", protect, authorize("admin", "volunteer"), async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  request.status = req.body.status;
  await request.save();
  res.json(request);
});

export default router;
