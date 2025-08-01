import express from "express";
import { User, OtpRequest } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import twilio from "twilio";
import axios from 'axios';
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import authMiddleware from "../middlewares/authMiddleware.js";
import { findUserByPhone, findOtpByPhone, createNewUser, findReferral, decrypt } from "../services/actions.js";
import { updateReferrerDetails } from "../services/actions.js";

dotenv.config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);

router.post("/send-otp", async (req, res) => {
  const { mobile, resetPassword } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  try {
    const gen_otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!resetPassword) {
      let result = await findUserByPhone(mobile);
      if (result.success) {
        res.status(409).json({ message: "User already exists" });
        return
      }
    }

    let data = await findOtpByPhone(mobile)
    if (data.code === 200) {
      await OtpRequest.deleteOne({ phone: mobile })
    }

    const formattedMobile = mobile.startsWith('+91') ? mobile : `+91${mobile}`;

    const otp = new OtpRequest({
      phone: formattedMobile,
      otp: gen_otp
    });

    await otp.save();

    // twilioClient.messages.create({
    //   body: `Your OTP for Cricstock is: ${gen_otp}`,
    //   from: twilioNumber,
    //   to: formattedMobile
    // })

    axios.post(
      process.env.WHATSAMPLIFY_URL,
      {
        otp: gen_otp,
        mobile: formattedMobile.replace(/^\+/, ""),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          key: 'cricstock11@12',
        },
      }
    ).catch((error) => {
      console.error('Error:', error.response?.data || error.message);
    });
    // .then(() => console.log(`OTP sent to ${formattedMobile} via Twilio...`))
    // .catch(console.error);

    // handle Twilio errors with a timeout (but it's not working because it always times out)
    // function timeoutAfter(ms) {
    //   return new Promise((_, reject) => {
    //     setTimeout(() => reject(new Error("Timeout")), ms);
    //   });
    // }
    //
    // try {
    //   await Promise.race([
    //     twilioClient.messages.create({
    //       body: `Your OTP for Cricstock is: ${gen_otp}`,
    //       from: twilioNumber,
    //       to: formattedMobile // Use formatted number
    //     }),
    //     timeoutAfter(3000),
    //   ]);
    //
    //   res.status(200).json({ success: true, message: "OTP sent successfully" });
    //
    // } catch (err) {
    //   console.error("Twilio failed", err.message);
    //   res.status(500).json({ success: false, message: "Could not send OTP. Try again." });
    // }

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({
      message: "Error sending OTP",
      error: err.message,
      details: "Please ensure mobile number is in correct format (+[country code][number])"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { name, mobile, email, password, new_password, otp, referralCode } = req.body;
    const data = await OtpRequest.findOne({ phone: mobile });

    if (!data || data.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new_password) {
      const user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPassword = await bcrypt.hash(new_password, 10);
      user.password = hashedPassword;
      await user.save();
      res.status(201).json({ message: "Password reset successfully" });
      return;
    }

    // Referral code logic
    let referralResult;
    if (referralCode) {
      referralResult = await findReferral(referralCode);
      if (!referralResult.success) {
        return res.status(403).json({ message: "Invalid Referral Code" });
      }
    }

    // Only call createNewUser once, with correct params
    const newUser = await createNewUser(name, mobile, email, password, referralCode);
    if (newUser.success) {
      if (referralCode && referralResult.success) {
        await updateReferrerDetails(referralResult.phone, referralCode)
      }
      res.status(201).json({ message: "OTP verified and NEW USER created successfully" });
    } else if (!newUser.success && newUser.code == 403) {
      res.status(403).json({ message: "Invalid Referral Code" });
    } else if (!newUser.success && newUser.code == 409) {
      res.status(409).json({ message: "User already exists" });
    } else {
      res.status(newUser.code).json({ message: "Error Inserting New User" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// Set Password
// router.post("/set-password", async (req, res) => {
//   const { mobile, password } = req.body;
//
//   try {
//     const user = await User.findOne({ mobile });
//     if (!user || !user.isVerified) {
//       return res.status(400).json({ message: "User not verified" });
//     }
//
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     await user.save();
//
//     res.json({ message: "Password set successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Error setting password" });
//   }
// });

// Login User
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  // console.log("/login : Received mobile number - ", mobile)

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ token, message: "Login successful" });

    // res.cookie('token', token,
    //   {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: 'None',
    //     maxAge: 7 * 24 * 60 * 60 * 1000,
    //   })
    //   .json({ token, message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
});


router.post("/google-login", async (req, res) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ message: "Token ID is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    if (!ticket) {
      console.error("Invalid Google token");
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const { email, name, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
        googleId: sub,
        isVerified: false,
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });


    res.cookie('token', token,
      {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      })
      .json({ token, message: "Google Sign-In successful" });
  } catch (error) {
    console.error("Google Authentication Error:", error);
    res
      .status(500)
      .json({ message: "Google authentication failed", error: error.message });
  }
});

router.get("/whoami", authMiddleware, async (req, res) => {

  try {
    const user = await User.findOne({ _id: req.user.userId });

    if (!user) {
      res.status(400).json({ message: "User not found" });
      return
    }

    res.status(200).json({ user, message: "User Found" });
  } catch (err) {
    res.status(500).json({ message: "Error finding user" });
  }
});

router.post('/logout', (req, res) => {

  res.clearCookie('token', {
    httpOnly: true,
    secure: true,       // same as when it was set
    sameSite: 'None',   // same as when it was set
    path: '/',          // must match the original cookie
  });

  res.status(200).json({ message: 'Logged out' });
});

router.get("/is-admin", authMiddleware, async (req, res) => {
  try {
    // Find user by ID in MongoDB
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({
      message: "User is Admin",
      data: {
        name: user.name,
        role: user.role,
      }
    });
  }
  catch (err) {
    console.error("❌ Error fetching user data:", err);
    res.status(500).json({ message: "Error fetching user data" });
  }
}
)

router.post("/forgot-password/sendOtp", async (req, res) => {
  const { mobile } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    // Send OTP via Twilio
    const messsage = await twilioClient.messages.create({
      body: `Your password reset OTP is: ${otp}`,
      from: twilioNumber,
      to: mobile,
    });

    res.json({ message: "OTP sent successfully for password reset" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
});

router.post("/change-password", async (req, res) => {
  const { mobile, newPassword } = req.body;

  try {
    // Find the user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    // Check if old password is correct
    // const isMatch = await bcrypt.compare(oldPassword, user.password);
    // if (!isMatch) {
    //   return res.json({ message: "Incorrect old password" });
    // }

    // console.log(user)

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.json({ message: "Server error" });
  }
});

router.get("/user", authMiddleware, async (req, res) => {
  // console.log("/user invoked", req)
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;

    // Find user by ID in MongoDB
    const user = await User.findById(userId).select("name mobile lastSeen email profileImage amount referralAmount -_id");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("❌ Error fetching user data:", err);
    res.status(500).json({ success: false, message: "Error fetching user data" });
  }
});

// For the user who logged in using Google SignIn
router.post("/verify-mobile", authMiddleware, async (req, res) => {

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OtpRequest.findOneAndUpdate(
      { phone: mobile },
      {
        $set: { otp } // Fields to update or set
      },
      {
        upsert: true,        // Create if not exists
        new: true,           // Return the updated or new document
        setDefaultsOnInsert: true // Apply schema defaults when inserting
      }
    );

    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioNumber,
      to: mobile,
    });

    res.status(200).json({ message: "OTP sent succesfully" });
  } catch (err) {
    res.status(500).json({ message: "Error Sending otp" });
  }
});

router.post("/verify-mobile-otp", authMiddleware, async (req, res) => {
  try {
    const { otp, phone } = req.body;
    if (!otp || !phone) {  // ✅ Ensure both values exist
      return res.status(400).json({ message: "OTP and mobile are required" });
    }

    const userOtp = await OtpRequest.findOne({ phone });
    if (!userOtp) {
      return res.status(404).json({ message: "OTP not found" });
    }

    if (userOtp.otp != otp) { // ✅ Ensure correct comparison
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // console.log("user :", user)
    // user.mobile = phone;
    // user.isVerified = true;
    // await user.save();

    res.status(200).json({ message: "Phone verified successfully" });

  } catch (err) {
    console.error("❌ Error verifying OTP:", err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

router.post('/add-referral-code', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user data in token" });
    }

    const userId = req.user.userId;
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ message: "No Referral Code Found" });
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "No Such User Found" });
    }

    if (user.referralCodes && user.referralCodes.includes(referralCode)) {
      return res.status(409).json({ message: "Referral Code already added" });
    }

    user.referralCodes.push(referralCode);
    await user.save();

    return res.status(200).json({ message: "Added Referral Code" });
  } catch (error) {
    if (res.headersSent) {
      console.error("Error after headers sent:", error);
      return;
    }
    res.status(500).json({ message: error?.message || "Internal Server Error" });
  }
})

export default router;
