import express from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authMiddleware.js";
import { User } from "../models/User.js"
import Withdrawl from "../models/Withdrawl.js"

const router = express.Router();
dotenv.config();

// New endpoint to check user's current holdings for a specific player
router.get("/player-holdings/:matchId/:playerId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;
    const { matchId, playerId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find all active holdings for this player in this match
    const playerHoldings = user.playerPortfolios.filter(portfolio => 
      String(portfolio.playerId).trim() === String(playerId).trim() &&
      String(portfolio.matchId).trim() === String(matchId).trim() &&
      portfolio.status !== "Sold"
    );

    // Calculate total investment in this player
    let totalInvestment = 0;
    let totalQuantity = 0;
    let averagePrice = 0;

    if (playerHoldings.length > 0) {
      for (const holding of playerHoldings) {
        const quantity = Number(holding.quantity) || 0;
        const price = Number(holding.boughtPrice) || 0;
        totalInvestment += quantity * price;
        totalQuantity += quantity;
      }
      
      if (totalQuantity > 0) {
        averagePrice = totalInvestment / totalQuantity;
      }
    }

    // Calculate remaining amount that can be invested (max ₹25,000)
    const maxInvestment = 25000;
    const remainingInvestment = Math.max(0, maxInvestment - totalInvestment);

    res.status(200).json({
      success: true,
      message: "Player holdings fetched successfully",
      data: {
        totalInvestment: totalInvestment.toFixed(2),
        totalQuantity,
        averagePrice: averagePrice.toFixed(2),
        remainingInvestment: remainingInvestment.toFixed(2),
        maxInvestment,
        canBuy: remainingInvestment > 0,
        holdings: playerHoldings
      }
    });
  } catch (error) {
    console.error("Error fetching player holdings:", error);
    res.status(500).json({
      success: false,
      message: error?.message || error
    });
  }
});

// New endpoint to check user's current holdings for a specific team
router.get("/team-holdings/:matchId/:teamId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;
    const { matchId, teamId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find all active holdings for this team in this match
    const teamHoldings = user.teamPortfolios.filter(portfolio => 
      String(portfolio.team).trim() === String(teamId).trim() &&
      String(portfolio.matchId).trim() === String(matchId).trim() &&
      portfolio.status !== "Sold"
    );

    // Calculate total investment in this team
    let totalInvestment = 0;
    let totalQuantity = 0;
    let averagePrice = 0;

    if (teamHoldings.length > 0) {
      for (const holding of teamHoldings) {
        const quantity = Number(holding.quantity) || 0;
        const price = Number(holding.boughtPrice) || 0;
        totalInvestment += quantity * price;
        totalQuantity += quantity;
      }
      
      if (totalQuantity > 0) {
        averagePrice = totalInvestment / totalQuantity;
      }
    }

    // Calculate remaining amount that can be invested (max ₹25,000)
    const maxInvestment = 25000;
    const remainingInvestment = Math.max(0, maxInvestment - totalInvestment);

    res.status(200).json({
      success: true,
      message: "Team holdings fetched successfully",
      data: {
        totalInvestment: totalInvestment.toFixed(2),
        totalQuantity,
        averagePrice: averagePrice.toFixed(2),
        remainingInvestment: remainingInvestment.toFixed(2),
        maxInvestment,
        canBuy: remainingInvestment > 0,
        holdings: teamHoldings
      }
    });
  } catch (error) {
    console.error("Error fetching team holdings:", error);
    res.status(500).json({
      success: false,
      message: error?.message || error
    });
  }
});

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
