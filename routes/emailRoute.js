import express from "express";
import nodemailer from "nodemailer"
import authMiddleware from '../middlewares/authMiddleware.js';;
import dotenv from "dotenv";
import { User } from "../models/User.js";
import Withdrawl from "../models/Withdrawl.js";
import { findAdminById } from "../services/actions.js";
dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_MAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

router.post("/withdrawal-request", authMiddleware, async (req, res) => {
  try {
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
    if (!accountName || !email || !amount || !accountNumber || !ifsc || !bankName || !phone) {
      return res.status(400).send("All fields are required.");
    }

    if (user.amount < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    const withdrawId = `ODR_${Date.now()}`;

    await Withdrawl.create({
      accountName,
      email,
      amount,
      accountNumber,
      ifsc,
      bankName,
      phone,
      aadhar,
      pan,
      orderId: withdrawId,
      userMobile: user.mobile
    });

    const newTransaction = {
      tID: withdrawId,
      oID: withdrawId,
      amount: amount,
      status: "Pending",
      type: "Withdrawal",
      method: "BT",
      txnDate: new Date(),
    };

    user.transactions.push(newTransaction);

    user.amount -= amount

    await user.save();

    return res.status(200).json({ success: true, message: "Withdrawl Request Sent" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, message: "Error sending request" });
  }
});

router.post("/withdrawal-approval", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }

    const isAdmin = await findAdminById(req.user.userId)
    if (!isAdmin.success) {
      return res.status(404).json({
        success: false,
        message: "Restricted Routes"
      });
    }

    if (isAdmin.data.role !== "financial" || isAdmin.data.role !== "super_admin") {
      return res.status(404).json({
        success: false,
        message: "Accessible to Financial and Super Admin"
      });
    }

    const { approval, orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    const withdrawlResponse = await Withdrawl.findOne({ orderId: orderId });

    if (!withdrawlResponse) {
      return res.status(404).json({
        success: false,
        message: "No Such Withdrawl Request"
      });
    }
    const user = await User.findOne({ mobile: withdrawlResponse.userMobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No Such User"
      });
    }


    const pendingWithdrawal = user.transactions.find(
      (txn) => txn.oID === orderId && txn.status === "Pending" && txn.type === "Withdrawal"
    );

    if (!pendingWithdrawal) {
      return res.status(404).json({
        success: false,
        message: "No pending withdrawal transaction found for this order"
      });
    }

    if (approval) {
      pendingWithdrawal.status = "Verified";
      const mailOptions = {
        from: process.env.GOOGLE_MAIL,
        to: "xxcricstock11@gmail.com",
        subject: `Withdrawal Request - Ready for Payment`,
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 32px auto; border-radius: 12px; box-shadow: 0 4px 24px #e0e7ef; background: #f8fafc; padding: 0;">
        <div style="background: linear-gradient(90deg, #1a237e 0%, #3949ab 100%); border-radius: 12px 12px 0 0; padding: 32px 0 18px 0; text-align: center;">
          <h1 style="color: #fff; font-size: 2.2rem; margin: 0; letter-spacing: 1px;">Withdrawal Request - Verified</h1>
        </div>
        <div style="padding: 32px 32px 24px 32px;">
          <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px #e0e7ef;">
            <tbody>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; width: 210px; border-bottom: 1px solid #e3e8ee;">Account Holder Name</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.accountName}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Email Address</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.email}</td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Phone Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.phone}</td>
              </tr>
              <tr>
              <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Account Number</td>
              <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.accountNumber}</td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">IFSC Code</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.ifsc}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Bank Name</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.bankName}</td>
              </tr>
              <tr style="background: #f1f5fb;">
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Aadhar Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.aadhar}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">PAN Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawlResponse.pan}</td>
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
                <td style="padding: 14px 18px;">₹${withdrawlResponse.amount}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">GST (28%)</td>
                <td style="padding: 14px 18px;">₹${(withdrawlResponse.amount * 0.28).toFixed(2)}</td>
              </tr>
              ${withdrawlResponse.amount > 10000
            ? `<tr style="background: #f1f5fb;">
                        <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">TDS (1%)</td>
                        <td style="padding: 14px 18px;">₹${(withdrawlResponse.amount * 0.01).toFixed(2)}</td>
                      </tr>`
            : ""
          }
              <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">Net Withdrawal Amount</td>
                <td style="padding: 14px 18px; font-weight: 700; color: #388e3c;">
                  ₹${(withdrawlResponse.amount - (withdrawlResponse.amount * 0.28) - (withdrawlResponse.amount * 0.01)).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 32px;">
            This withdrawal request has been verified and is ready for payment processing.
          </p>
          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 8px;">
            This is an automated notification from <b>cricstock11@gmail.com</b>
          </p>
        </div>
      </div>
    `,
      };
      await transporter.sendMail(mailOptions);
    } else {
      pendingWithdrawal.status = "Failed";
      user.amount += Number(withdrawlResponse.amount)
    }

    await user.save();

    return res.status(200).json({ success: true, message: `Withdrawal ${approval ? "Verified" : "Failed"}` });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, message: "Error sending email." });
  }
});

router.post("/contact-request", async (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "All fields are required: name, phone, email, subject, message."
    });
  }

  const mailOptions = {
    from: process.env.GOOGLE_MAIL,
    to: "xxcricstock11@gmail.com",
    subject: `Contact Request`,
    html: `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 32px auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); background: #ffffff; overflow: hidden;">
  <!-- Header -->
  <div style="background: linear-gradient(90deg, #283593 0%, #5c6bc0 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 2rem; margin: 0; letter-spacing: 0.5px;">Contact Request</h1>
  </div>

  <!-- Body -->
  <div style="padding: 32px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
      <tbody>
        <tr style="background: #f5f7fa;">
          <td style="padding: 14px 20px; font-weight: 600; color: #283593; width: 200px; border-bottom: 1px solid #e3e8ee;">Name</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #e3e8ee;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; font-weight: 600; color: #283593; border-bottom: 1px solid #e3e8ee;">Phone</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #e3e8ee;">${phone}</td>
        </tr>
        <tr style="background: #f5f7fa;">
          <td style="padding: 14px 20px; font-weight: 600; color: #283593; border-bottom: 1px solid #e3e8ee;">Email</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #e3e8ee;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 14px 20px; font-weight: 600; color: #283593; border-bottom: 1px solid #e3e8ee;">Message</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid #e3e8ee; white-space: pre-line;">${message}</td>
        </tr>
        <tr>
          <span style="float: right; font-weight: 400; font-size: 12px; color: #607d8b;">
            ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </span>
        </tr>
      </tbody>
    </table>

    <p style="font-size: 12px; color: #607d8b; text-align: center; margin-top: 28px; line-height: 1.6;">
      This is an automated notification from <strong>cricstock11@gmail.com</strong>
    </p>
  </div>
</div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Contact request sent successfully." });
  } catch (error) {
    console.error("Error sending contact request email:", error);
    return res.status(500).json({ success: false, message: "Error sending contact request email." });
  }
});
export default router;
