import express from "express";
import User from "../models/User.js";
import Alert from "../models/Alert.js";
import Request from "../models/Request.js";
import Shelter from "../models/Shelter.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalAlerts = await Alert.countDocuments();
      const totalRequests = await Request.countDocuments();
      const pendingRequests = await Request.countDocuments({ status: "Pending" });
      const approvedRequests = await Request.countDocuments({ status: "Approved" });
      const assignedRequests = await Request.countDocuments({ status: "Assigned" });
      const resolvedRequests = await Request.countDocuments({ status: "Resolved" });
      const totalShelters = await Shelter.countDocuments({ isActive: true });

      res.json({
        totalUsers,
        totalAlerts,
        totalRequests,
        pendingRequests,
        approvedRequests,
        assignedRequests,
        resolvedRequests,
        totalShelters
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching stats" });
    }
  }
);

export default router;
