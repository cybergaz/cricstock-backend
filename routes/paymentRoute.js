import express from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authMiddleware.js";
import { User } from "../models/User.js"

const router = express.Router();
dotenv.config();

const ID = process.env.CASHFREE_ID;
const SECRET = process.env.CASHFREE_SECRET;
const URL = process.env.CASHFREE_URL;
const FRONT = process.env.FRONTEND_URL;

router.post("/order/create",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user data in token" });
      }

      const userId = req.user.userId;

      const { amount } = req.body;

      const user = await User.findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const orderId = `ODR_${Date.now()}`
      const txnId = `ODR_${Date.now()}`

      const orderRequest = {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),
          customer_name: String(user.name),
          customer_phone: String(user.mobile) || String(user.email),
        },
        order_meta: {
          return_url: `${FRONT}/wallet?ODR=${orderId}`,
        },
      };

      const response = await fetch(`${URL}orders`, {
        method: "POST",
        headers: {
          "x-api-version": "2025-01-01",
          "x-client-id": ID,
          "x-client-secret": SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderRequest),
      });

      const result = await response.json();

      const newTransaction = {
        tID: txnId,
        oID: orderId,
        amount: amount,
        txnDate: new Date(),
      };

      user.transactions.push(newTransaction);

      await user.save();

      res.status(200).json({
        success: true,
        message: "Order Created Successfully",
        orderDetails: {
          orderId: result.order_id,
          orderAmount: result.order_amount,
          createdAt: result.created_at,
          paymentSessionId: result.payment_session_id,
        },
      });
    } catch (error) {
      console.error("Error Creating Order:", error);
      res.status(500).json({
        success: false,
        message: error
      });
    }
  });

router.patch("/order/terminate/:order_id", async (req, res) => {
  try {
    const { order_id } = req.params;
    const response = await fetch(
      `https://api.cashfree.com/pg/orders/${order_id}`,
      {
        method: "PATCH",
        headers: {
          "x-api-version": "2025-01-01",
          "x-client-id": ID,
          "x-client-secret": SECRET,
          "Content-Type": "application/json",
        },
        body: '{"order_status":"TERMINATED"}'
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return res
        .status(400)
        .json({ error: result.message || "Unable to fetch order details." });
    }
    return res
      .status(200)
      .json({ status: String(result.order_status).toLowerCase() });
  } catch (error) {
    console.error("Error checking order status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/order/check/:order_id", authMiddleware, async (req, res) => {
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
    const { order_id } = req.params;
    const { status } = req.body;
    const response = await fetch(
      `${URL}orders/${order_id}`,
      {
        method: "GET",
        headers: {
          "x-api-version": "2025-01-01",
          "x-client-id": ID,
          "x-client-secret": SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    const result = await response.json();
    const orderStatus = result.order_status;
    if (orderStatus == undefined) {
      return res.status(400).json({
        success: false,
        message: `No Such Transaction`
      });
    }
    if (orderStatus !== "PAID") {
      return res.status(400).json({
        success: false,
        message: `Payment ${orderStatus.slice(0, 1)}${orderStatus.slice(1).toLowerCase()}`
      });
    }
    const allowedStatuses = ["Pending", "Completed", "Failed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`
      });
    }
    if (!Array.isArray(user.transactions)) {
      user.transactions = [];
    }
    const txnIndex = user.transactions.findIndex(
      (txn) => String(txn.oID) === String(order_id)
    );
    if (txnIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found for this order"
      });
    }
    if (user.transactions[txnIndex].status === "Completed") {
      return res.status(404).json({
        success: false,
        message: "Transaction not found for this order"
      });
    }
    if (status === "Completed" && orderStatus !== "PAID") {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as Completed. Cashfree order status is: ${orderStatus}`
      });
    }
    if (status === "Completed") {
      const txn = user.transactions[txnIndex];
      if (typeof txn.amount === "number") {
        if (user.referredBy !== "") {
          const referralBonus = Math.min(txn.amount * 0.1, 1000);
          user.referralAmount = referralBonus;
          const referredUser = await User.findOne({ mobile: user.referredBy });
          referredUser.referralAmount += referralBonus;
          await referredUser.save();
        }
        user.amount += Number(txn.amount);
      }
    }
    user.transactions[txnIndex].status = status;
    user.transactions[txnIndex].date = new Date();
    user.lastSeen = new Date();
    await user.save();
    res.status(200).json({
      success: true,
      message: `Transaction ${status}`
    });
  } catch (err) {
    console.error("Error updating transaction status:", err);
    res.status(500).json({
      success: false,
      message: "Error updating transaction status"
    });
  }
});

export default router;
