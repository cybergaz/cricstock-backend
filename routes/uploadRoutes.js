import express from "express";
import multer from "multer";
import cloudinary from "../uploadImage/cloudinary.js";
import { User } from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({});
const upload = multer({ storage });

router.post("/upload-profile", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_profiles",
    });

    const userId = req.user.userId;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: result.secure_url },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ message: "Image upload failed", error });
  }
});

export default router;
