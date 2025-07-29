import express from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authMiddleware.js";
import { User } from "../models/User.js"
import Withdrawl from "../models/Withdrawl.js"

const router = express.Router();
dotenv.config();

router.get("/data",
  authMiddleware,
  async (req, res) => {
    try {

      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user data in token" });
      }

      const userId = req.user.userId;

      const user = await User.findOne({ _id: userId })
        .select("-password -__v -resetToken -resetTokenExpiry -otp -otpExpiry");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        success: true,
        message: "User Fetched Successfully",
        data: user
      });
    } catch (error) {
      console.error("Error finding User:", error);
      res.status(500).json({
        success: false,
        message: error?.message || error
      });
    }
  });

// Route to get user's last withdrawal request for auto-filling form
router.get("/last-withdrawal",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user data in token" });
      }

      const userId = req.user.userId;
      
      // Get user's mobile number to find their withdrawal requests
      const user = await User.findOne({ _id: userId }).select("mobile");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find the most recent withdrawal request for this user
      const lastWithdrawal = await Withdrawl.findOne({ 
        userMobile: user.mobile 
      }).sort({ createdAt: -1 });

      if (!lastWithdrawal) {
        return res.status(200).json({
          success: true,
          message: "No previous withdrawal requests found",
          data: null
        });
      }

      // Return the withdrawal data (excluding amount and orderId for security)
      const withdrawalData = {
        accountName: lastWithdrawal.accountName,
        accountNumber: lastWithdrawal.accountNumber,
        ifsc: lastWithdrawal.ifsc,
        bankName: lastWithdrawal.bankName,
        email: lastWithdrawal.email,
        phone: lastWithdrawal.phone,
        aadhar: lastWithdrawal.aadhar || "",
        pan: lastWithdrawal.pan || ""
      };

      res.status(200).json({
        success: true,
        message: "Last withdrawal data fetched successfully",
        data: withdrawalData
      });
    } catch (error) {
      console.error("Error fetching last withdrawal:", error);
      res.status(500).json({
        success: false,
        message: error?.message || error
      });
    }
  });

export default router;
