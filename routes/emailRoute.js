import express from "express";
import nodemailer from "nodemailer"
import authMiddleware from '../middlewares/authMiddleware.js';;
import dotenv from "dotenv";
import { User } from "../models/User.js";
dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_MAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

router.post("/withdrawl-request", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No user data in token"
    });
  }
  const user = await User.findById(req.user.userId).select();
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No Such User"
    });
  }
  const { accountName, email, amount, accountNumber, ifsc, bankName, phone, aadhar, pan } = req.body;
  if (user.amount < amount) {
    return res.status(400).json({
      success: false,
      message: "Insufficient balance"
    });
  }

  const withdrawId = `ODR_${Date.now()}`;
  const newTransaction = {
    tID: withdrawId,
    oID: withdrawId,
    amount: amount,
    status: "Completed",
    type: "Withdrawal",
    method: "BT",
    txnDate: new Date(),
  };

  user.transactions.push(newTransaction);

  if (!accountName || !email || !amount || !accountNumber || !ifsc || !bankName || !phone) {
    return res.status(400).send("All fields are required.");
  }

  const mailOptions = {
    from: process.env.GOOGLE_MAIL,
    to: "xxcricstock11@gmail.com",
    subject: `Withdrawal Request`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 32px auto; border: 1px solid #d1d5db; border-radius: 10px; box-shadow: 0 2px 8px #e0e7ef; padding: 32px 28px; background: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a237e; font-size: 2rem; margin: 0;">Withdrawal Request Notification</h1>
        </div>
        <p style="font-size: 16px; color: #222; margin-bottom: 18px;">
          Dear Admin,<br>
          <br>
          You have received a new withdrawal request. Please review the details below and process the request at your earliest convenience.
        </p>
        <table style="width: 100%; font-size: 15px; color: #222; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 180px;">Account Holder Name:</td>
            <td style="padding: 8px 0;">${accountName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Email Address:</td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Phone Number:</td>
            <td style="padding: 8px 0;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Withdrawal Amount:</td>
            <td style="padding: 8px 0;">₹${amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Account Number:</td>
            <td style="padding: 8px 0;">${accountNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">IFSC Code:</td>
            <td style="padding: 8px 0;">${ifsc}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Bank Name:</td>
            <td style="padding: 8px 0;">${bankName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Aadhar Number:</td>
            <td style="padding: 8px 0;">${aadhar}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">PAN Number:</td>
            <td style="padding: 8px 0;">${pan}</td>
          </tr>
        </table>
        <div style="margin-bottom: 18px;">
          <span style="font-size: 14px; color: #374151;">
            <strong>Request ID:</strong> <span style="color: #1a237e;">${withdrawId}</span><br>
            <strong>Request Date:</strong> <span style="color: #1a237e;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
          </span>
        </div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
        <p style="font-size: 13px; color: #888; text-align: center;">
          This is an automated notification from <b>cricstock11@gmail.com</b>.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    user.amount -= amount;
    await user.save();
    return res.status(200).json({ success: true, message: "Email sent and balance updated successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, message: "Error sending email." });
  }
});

export default router;
