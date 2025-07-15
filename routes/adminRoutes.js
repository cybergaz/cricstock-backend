import express from 'express';
import { User } from '../models/User.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { checkIsSuperAdmin } from "../services/actions.js"

const router = express.Router();

router.get('/total-users', async (req, res) => {
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

router.get('/total-active-users', async (req, res) => {
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
})

router.get('/company-statement', async (req, res) => {
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
    const result = await User.findOneAndUpdate(
      { _id: id },
      { $set: { isAdmin: true, role } },
      {
        new: true,
      }
    );

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

export default router;
