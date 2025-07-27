import express from 'express';
import { User } from '../models/User.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { checkIsSuperAdmin } from "../services/actions.js"
import { Company } from '../models/Company.js';
import Withdrawl from '../models/Withdrawl.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_MAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

const router = express.Router();

router.get('/total-registered-users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: 'Total registered users count retrieved',
      count: totalUsers
    });
  } catch (error) {
    console.error('Error counting registered Users:', error);
    res.status(500).json({
      message: 'Failed to count registered users',
      error: error.message
    });
  }
});

// using sockets
// router.get('/total-active-users', async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();
//
//     res.status(200).json({
//       message: 'Total registered users count retrieved',
//       count: totalUsers
//     });
//   } catch (error) {
//     console.error('Error counting registered Users:', error);
//     res.status(500).json({
//       message: 'Failed to count registered users',
//       error: error.message
//     });
//   }
// })

// using lastSeen field
router.get('/total-active-users', async (req, res) => {
  try {
    // fetch all users and filter based on lastSeen where lastSeen is within the last 10 minute
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastSeen: { $gte: tenMinutesAgo }
    });

    res.status(200).json({
      message: 'Total active users count retrieved',
      count: activeUsers
    });
  } catch (error) {
    console.error('Error counting active Users:', error);
    res.status(500).json({
      message: 'Failed to count active users',
      error: error.message
    });
  }
})

router.get('/company-statement', authMiddleware, async (req, res) => {
  try {
    const company_stats = await Company.findOne({ name: "cricstock11" });
    console.log("company_stats -> ", company_stats)
    // console.log("company_stats -> ", company_stats)
    const result = await User.aggregate([
      {
        $facet: {
          totalUserAmount: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
              },
            },
          ],
          totalCompletedDeposits: [
            { $unwind: "$transactions" },
            {
              $match: {
                "transactions.status": "Completed",
                "transactions.type": "Deposit",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$transactions.amount" },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalUserAmount: { $arrayElemAt: ["$totalUserAmount.total", 0] },
          totalCompletedDeposits: { $arrayElemAt: ["$totalCompletedDeposits.total", 0] },
        },
      },
    ]);

    // console.log(result[0]);

    const gross_profit = result[0].totalCompletedDeposits - result[0].totalUserAmount

    res.status(200).json({
      message: 'Company statistics retrieved successfully',
      data: {
        name: company_stats.name,
        totalProfits: company_stats.totalProfits.toFixed(2),
        profitFromPlatformFees: company_stats.profitFromPlatformFees.toFixed(2),
        profitFromProfitableCuts: company_stats.profitFromProfitableCuts.toFixed(2),
        profitFromUserLoss: company_stats.profitFromUserLoss.toFixed(2),
        profitFromAutoSell: company_stats.profitFromAutoSell.toFixed(2),
        grossProfit: gross_profit.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error retrieving companny stats:', error);
    res.status(500).json({
      message: 'Failed to retrieve company statistics',
      error: error.message
    });
  }
});

router.get('/users-statement', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      message: 'Total registered users count retrieved',
      count: totalUsers
    });
  } catch (error) {
    console.error('Error counting registered Users:', error);
    res.status(500).json({
      message: 'Failed to count registered users',
      error: error.message
    });
  }
});

router.get('/fetch-users', async (req, res) => {
  const query = req.query.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    if (query) {
      // Search by name, phone number or email if query exists
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { mobile: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).select("name email mobile amount portfolio");

      return res.status(200).json({ users });
    }

    // Regular pagination if no query
    const users = await User.find({})
      .skip(skip)
      .limit(limit)
      .select("name email mobile amount portfolio");

    const total = await User.countDocuments();

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get('/fetch-all-admins', authMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('_id name role');

    if (!admins) {
      return res.status(404).json({ message: "No Admin Found" })
    }

    res.status(200).json({ data: admins });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get('/user-details', async (req, res) => {

  const user_id = req.query.id;
  if (!user_id) {
    return res.status(400).json({ message: "User ID not provided" });
  }

  try {
    const user = await User.findOne({ _id: user_id })

    if (!user) {
      return res.status(404).json({ message: "User Not Found" })
    }
    // console.log(users)

    res.status(200).json({
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post('/promote-user-to-admin', authMiddleware, async (req, res) => {
  const { id, role } = req.body;
  const admin_id = req.user.userId;

  const result = await checkIsSuperAdmin(admin_id);
  if (!result.success) {
    return res.status(result.code).json({ message: result.message });
  }

  if (!role) {
    return res.status(400).json({ message: "Role is not provided in the body" });
  }

  try {
    let result;
    if (role === "user") {

      result = await User.findOneAndUpdate(
        { _id: id },
        { $set: { isAdmin: false, role } },
        {
          new: true,
        }
      );
    } else {
      result = await User.findOneAndUpdate(
        { _id: id },
        { $set: { isAdmin: true, role } },
        {
          new: true,
        }
      );
    }

    if (!result) {
      res.status(400).send("User not found");
    }
    res.status(201).json({
      message: "New admin created successfully",
    });
  } catch (error) {
    console.error('Error creating new admin:', error);
    res.status(500).json({
      message: 'Failed to create new admin',
      error: error.message
    });
  }

})

router.get('/fetch-profitable-users', authMiddleware, async (req, res) => {
  try {
    const all_users = await User.find()

    let count = 0

    for (const user of all_users) {
      const totalTransactionAmount = user.transactions.reduce((acc, transaction) => {
        if (transaction.status !== "Completed") {
          return acc;
        }
        return acc + transaction.amount;
      }, 0);

      if (user.amount > totalTransactionAmount) {
        count++;
      }
    }

    res.status(200).json({ count });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch profitable users" });
  }
})

router.get('/fetch-users-having-loss', authMiddleware, async (req, res) => {
  try {
    const all_users = await User.find()

    let count = 0

    for (const user of all_users) {
      const totalTransactionAmount = user.transactions.reduce((acc, transaction) => {
        if (transaction.status !== "Completed") {
          return acc;
        }
        return acc + transaction.amount;
      }, 0);

      if (user.amount < totalTransactionAmount) {
        count++;
      }
    }

    res.status(200).json({ count });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
})


router.get('/fetch-total-transactions', authMiddleware, async (req, res) => {
  try {
    const all_users = await User.find()

    let totalTransactionCount = 0
    let pendingDeposit = 0
    let completedDeposit = 0
    let failedDeposit = 0
    let depositAmount = 0
    let depositUsers = 0
    let pendingWithdraw = 0
    let completedWithdraw = 0
    let failedWithdraw = 0
    let withdrawAmount = 0
    let withdrawUsers = 0

    for (const user of all_users) {
      const totalTransactionAmount = user.transactions.map((trx, index) => {
        totalTransactionCount++;

        if (trx.status == "Completed") {
          if (trx.type === "Deposit") {
            depositAmount += trx.amount;
            completedDeposit++;
          } else if (trx.type === "Withdraw") {
            withdrawAmount += trx.amount;
            completedWithdraw++;
          }
        }
        if (trx.status === "Pending") {
          if (trx.type === "Deposit") {
            pendingDeposit++;
          } else if (trx.type === "Withdraw") {
            pendingWithdraw++;
          }
        }
        if (trx.status === "Failed") {
          if (trx.type === "Deposit") {
            failedDeposit++;
          } else if (trx.type === "Withdraw") {
            failedWithdraw++;
          }
        }

        if (trx.type === "Deposit" && trx.status === "Completed") {
          depositUsers++;
        }
        if (trx.type === "Withdraw" && trx.status === "Completed") {
          withdrawUsers++;
        }

      });

      if (user.amount < totalTransactionAmount) {
        count++;
      }
    }

    res.status(200).json({
      data: {
        totalTransactionCount,
        pendingDeposit,
        completedDeposit,
        failedDeposit,
        depositAmount,
        depositUsers,
        pendingWithdraw,
        completedWithdraw,
        failedWithdraw,
        withdrawAmount,
        withdrawUsers
      }
    });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
})

router.get('/fetch-inactive-users', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const inactiveUserPhones = await User.find(
      { lastSeen: { $lt: twentyFourHoursAgo } },
      { phone: 1, _id: 0 }  // Only return phone numbers, omit _id
    );

    const count = inactiveUserPhones.length;
    console.log("Inactive Users Count:", inactiveUserPhones);

    res.status(200).json({ count });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
})

router.get('/fetch-all-withdrawals', authMiddleware, async (req, res) => {
  const query = req.query.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    if (query) {
      // Search by name, phone number or email if query exists
      const withdrawals = await Withdrawl.find({
        $or: [
          { accountName: { $regex: query, $options: 'i' } },
          { accountNumber: { $regex: query, $options: 'i' } },
          { bankName: { $regex: query, $options: 'i' } },
          { aadhar: { $regex: query, $options: 'i' } },
          { pan: { $regex: query, $options: 'i' } },
          { orderId: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).select("-_id");

      return res.status(200).json({ withdrawals });
    }

    // Regular pagination if no query
    const withdrawals = await Withdrawl.find({})
      .skip(skip)
      .limit(limit)
      .select("-_id");

    const total = await Withdrawl.countDocuments();

    res.status(200).json({
      withdrawals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// Mark withdrawal as verified (financial/super_admin only)
router.post('/mark-withdrawal-verified', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }

    const isAdmin = await checkIsSuperAdmin(req.user.userId);
    if (!isAdmin.success) {
      return res.status(403).json({
        success: false,
        message: "Restricted Routes"
      });
    }

    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({
        success: false,
        message: "Order IDs array is required"
      });
    }

    const results = [];
    for (const orderId of orderIds) {
      const withdrawal = await Withdrawl.findOne({ orderId });
      if (!withdrawal) {
        results.push({ orderId, success: false, message: "Withdrawal not found" });
        continue;
      }

      const user = await User.findOne({ mobile: withdrawal.userMobile });
      if (!user) {
        results.push({ orderId, success: false, message: "User not found" });
        continue;
      }

      const transaction = user.transactions.find(
        txn => txn.oID === orderId && txn.type === "Withdrawal"
      );

      if (!transaction) {
        results.push({ orderId, success: false, message: "Transaction not found" });
        continue;
      }

      if (transaction.status !== "Pending") {
        results.push({ orderId, success: false, message: "Transaction is not pending" });
        continue;
      }

      // Update transaction status to Verified
      transaction.status = "Verified";
      await user.save();

      // Send email notification to boss after marking as verified
      try {
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
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.accountName}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Email Address</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.email}</td>
                </tr>
                <tr style="background: #f1f5fb;">
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Phone Number</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.phone}</td>
                </tr>
                <tr>
                <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Account Number</td>
                <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.accountNumber}</td>
                </tr>
                <tr style="background: #f1f5fb;">
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">IFSC Code</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.ifsc}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Bank Name</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.bankName}</td>
                </tr>
                <tr style="background: #f1f5fb;">
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">Aadhar Number</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.aadhar}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e; border-bottom: 1px solid #e3e8ee;">PAN Number</td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e3e8ee;">${withdrawal.pan}</td>
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
                  <td style="padding: 14px 18px;">₹${withdrawal.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">GST (28%)</td>
                  <td style="padding: 14px 18px;">₹${(withdrawal.amount * 0.28).toFixed(2)}</td>
                </tr>
                ${withdrawal.amount > 10000
              ? `<tr style="background: #f1f5fb;">
                          <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">TDS (1%)</td>
                          <td style="padding: 14px 18px;">₹${(withdrawal.amount * 0.01).toFixed(2)}</td>
                        </tr>`
              : ""
            }
                <tr>
                  <td style="padding: 14px 18px; font-weight: 600; color: #1a237e;">Net Withdrawal Amount</td>
                  <td style="padding: 14px 18px; font-weight: 700; color: #388e3c;">
                    ₹${(withdrawal.amount - (withdrawal.amount * 0.28) - (withdrawal.amount * 0.01)).toFixed(2)}
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
        // console.log(`Email sent successfully for orderId: ${orderId}`);
      } catch (emailError) {
        console.error(`Error sending email for orderId ${orderId}:`, emailError);
        // Don't fail the entire operation if email fails
      }

      results.push({ orderId, success: true, message: "Marked as verified" });
    }

    return res.status(200).json({
      success: true,
      message: "Withdrawal verification completed",
      results
    });
  } catch (error) {
    console.error("Error marking withdrawals as verified:", error);
    return res.status(500).json({
      success: false,
      message: "Error marking withdrawals as verified"
    });
  }
});

// Mark withdrawal as completed (financial/super_admin only)
router.post('/mark-withdrawal-completed', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }

    const isAdmin = await checkIsSuperAdmin(req.user.userId);
    if (!isAdmin.success) {
      return res.status(403).json({
        success: false,
        message: "Restricted Routes"
      });
    }

    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({
        success: false,
        message: "Order IDs array is required"
      });
    }

    const results = [];
    for (const orderId of orderIds) {
      const withdrawal = await Withdrawl.findOne({ orderId });
      if (!withdrawal) {
        results.push({ orderId, success: false, message: "Withdrawal not found" });
        continue;
      }

      const user = await User.findOne({ mobile: withdrawal.userMobile });
      if (!user) {
        results.push({ orderId, success: false, message: "User not found" });
        continue;
      }

      const transaction = user.transactions.find(
        txn => txn.oID === orderId && txn.type === "Withdrawal"
      );

      if (!transaction) {
        results.push({ orderId, success: false, message: "Transaction not found" });
        continue;
      }

      if (transaction.status !== "Verified") {
        results.push({ orderId, success: false, message: "Transaction is not verified" });
        continue;
      }

      // Update transaction status to Completed
      transaction.status = "Completed";
      await user.save();

      results.push({ orderId, success: true, message: "Marked as completed" });
    }

    return res.status(200).json({
      success: true,
      message: "Withdrawal completion processed",
      results
    });
  } catch (error) {
    console.error("Error marking withdrawals as completed:", error);
    return res.status(500).json({
      success: false,
      message: "Error marking withdrawals as completed"
    });
  }
});

// Get withdrawal statuses for admin panel
router.get('/withdrawal-statuses', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user data in token"
      });
    }

    const isAdmin = await checkIsSuperAdmin(req.user.userId);
    if (!isAdmin.success) {
      return res.status(403).json({
        success: false,
        message: "Restricted Routes"
      });
    }

    const { orderIds } = req.query;
    if (!orderIds) {
      return res.status(400).json({
        success: false,
        message: "Order IDs are required"
      });
    }

    const orderIdArray = Array.isArray(orderIds) ? orderIds : [orderIds];
    const statuses = [];

    for (const orderId of orderIdArray) {
      const withdrawal = await Withdrawl.findOne({ orderId });
      if (!withdrawal) {
        statuses.push({ orderId, status: "Not Found" });
        continue;
      }

      const user = await User.findOne({ mobile: withdrawal.userMobile });
      if (!user) {
        statuses.push({ orderId, status: "User Not Found" });
        continue;
      }

      const transaction = user.transactions.find(
        txn => txn.oID === orderId && txn.type === "Withdrawal"
      );

      if (!transaction) {
        statuses.push({ orderId, status: "Transaction Not Found" });
        continue;
      }

      statuses.push({ orderId, status: transaction.status });
    }

    return res.status(200).json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error("Error fetching withdrawal statuses:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching withdrawal statuses"
    });
  }
});

export default router;
