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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 32px auto; border-radius: 12px; box-shadow: 0 4px 24px #e0e7ef; background: #f8fafc; padding: 0;">
        <div style="background: linear-gradient(90deg, #1a237e 0%, #3949ab 100%); border-radius: 12px 12px 0 0; padding: 32px 0 18px 0; text-align: center;">
          <h1 style="color: #fff; font-size: 2.2rem; margin: 0; letter-spacing: 1px;">Withdrawal Request</h1>
        </div>
        <div style="padding: 32px 32px 24px 32px;">
          <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px #e0e7ef;">
            <tbody>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; width: 210px; border-bottom: 1px solid #e3e8ee;">Account Holder Name</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${accountName}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Email Address</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${email}</td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Phone Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Account Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${accountNumber}</td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">IFSC Code</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${ifsc}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Bank Name</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${bankName}</td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Aadhar Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${aadhar}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">PAN Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${pan}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 18px 18px 4px 18px; font-weight: 700; color: #3949ab; font-size: 1.08rem; background: #e8eaf6; border-bottom: 1px solid #e3e8ee;">
                  Withdrawal Details
                  <span style="float: right; font-weight: 400; color: #607d8b; font-size: 0.58rem;">
                    ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </span>
                </td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">Requested Amount</td>
                <td style="padding: 14px 18px;">₹${amount}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">GST (28%)</td>
                <td style="padding: 14px 18px;">₹${(amount * 0.28).toFixed(2)}</td>
              </tr>
              ${amount > 10000
        ? `<tr style="background: #f1f5fb;">
                        <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">TDS (1%)</td>
                        <td style="padding: 14px 18px;">₹${(amount * 0.01).toFixed(2)}</td>
                      </tr>`
        : ""
      }
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">Net Withdrawal Amount</td>
                <td style="padding: 14px 18px; font-weight: 700; color: #388e3c;">
                  ₹${(amount - (amount * 0.28) - (amount * 0.01)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 32px;">
            This is an automated notification from <b>cricstock11@gmail.com</b>
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);

    user.amount -= amount

    await user.save();

    return res.status(200).json({ success: true, message: "Email sent and balance updated successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, message: "Error sending email." });
  }
});

export default router;
