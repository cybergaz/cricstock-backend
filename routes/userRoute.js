import express from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authMiddleware.js";
import { User } from "../models/User.js"

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

            // Exclude sensitive/unneeded fields
            // Exclude: password, __v, any tokens, and internal fields
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

export default router;