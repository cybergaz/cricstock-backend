import express from "express";
import multer from "multer";
import { User } from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import AWS from 'aws-sdk';
import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import 'dotenv/config';

const router = express.Router();

// Store file in memory (not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

// Configure AWS SDK
const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  region: process.env.AWS_REGION,
});

// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


export const uploadToS3 = async (file, bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: `${Date.now()}-${file.originalname}`, // Unique file name
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read', // Make the file publicly accessible
  };

  try {
    // console.log('Uploading to S3');
    const data = await new Upload({
      client: s3,
      params,
    }).done();
    return data.Location; // Return the file URL
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

router.post("/upload-profile", authMiddleware, upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return
  }

  try {
    // console.log('Uploading file to S3...');
    const fileUrl = await uploadToS3(req.file, process.env.AWS_BUCKET_NAME);

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.userId },
      { profileImage: fileUrl },
      { new: true }
    );

    res.status(200).json({ message: "Profile pic updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload file', error });
  }
})

export default router;
