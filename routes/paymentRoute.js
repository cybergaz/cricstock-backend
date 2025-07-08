import express from "express";
import dotenv from "dotenv";
// import authMiddleware from "../middlewares/authMiddleware";
import { User } from "../models/User.js"

const router = express.Router();
dotenv.config();

const ID = process.env.CASHFREE_ID;
const SECRET = process.env.CASHFREE_SECRET;
const URL = process.env.CASHFREE_URL;
const FRONT = process.env.FRONTEND_URL;

const deleteAllTransactions = async (mobile) => {
  await User.updateOne({ mobile }, { $set: { transactions: [] } });
  console.log("All recent transactions are deleted");
};

router.post("/order/create",
  // authMiddleware,
  async (req, res) => {
    try {
      // if (!req.user || !req.user.userId) {
      //   return res
      //     .status(401)
      //     .json({ message: "Unauthorized: No user data in token" });
      // }

      // const userId = req.user.userId;

      const { amount } = req.body;

      // const user = await User.findOne({ _id: userId });

      // deleteAllTransactions(user.mobile)
      // return

      // if (!user) {
      //   return res.status(404).json({ error: "User not found" });
      // }

      const orderId = `ORDER_${Date.now()}`;


      // {
      //   customer_id = "7112AAA812234",
      //     customer_email = "john@cashfree.com",
      //     customer_phone = "9908734801",
      //     customer_name = "John Doe",
      //     customer_bank_account_number = "1518121112",
      //     customer_bank_ifsc = "XITI0000001",
      //     customer_bank_code = 3333,
      //     customer_uid = "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
      // }
      
      const orderRequest = {
        order_id: orderId,
        order_amount: amount * 100,
        order_currency: "INR",
        customer_details: {
          customer_id: "123",
          customer_name: "dhruv",
          customer_phone: "1111111111",
          // customer_id: userId,
          // customer_name: user.name,
          // customer_phone: user.mobile,

        },
        order_meta: {
          return_url: `${FRONT
            .replace("http", "https")
            }/wallet?payment=success`,
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

      // const newTransaction = {
      //   tID: `TXN_${Date.now()}`,
      //   oID: `ODR_${Date.now()}`,
      //   amount: amount,
      //   txnDate: new Date(),
      // };

      // user.transactions.push(newTransaction);

      // await user.save();

      res.status(200).json({
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
      res.status(500).json({ error: "Server Error" });
    }
  });

router.get("/order/check/:order_id", async (req, res) => {
  try {
    const { order_id } = req.params;
    const response = await fetch(
      `https://api.cashfree.com/pg/orders/${order_id}`,
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
    if (!response.ok) {
      console.error("Failed to fetch order:", result);
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

export default router;

// router.post("/create-order", authMiddleware, async (req, res) => {
//   try {
//     if (!req.user || !req.user.userId) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: No user data in token" });
//     }

//     const userId = req.user.userId;
//     const { amount } = req.body;

//     if (!amount || isNaN(amount) || Number(amount) <= 0) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     const user = await User.findOne({ _id: userId });
//     // deleteAllTransactions(user.mobile)
//     // return

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const orderId = `ORDER_${Date.now()}`;
//     const transactionId = `TXN_${uuidv4()}`;

//     user.transactions.push({
//       TID: transactionId,
//       OID: orderId,
//       amount: amount,
//       status: "PENDING",
//     });

//     await user.save();

//     const orderRequest = {
//       order_id: orderId,
//       order_amount: amount,
//       order_currency: "INR",
//       customer_details: {
//         customer_id: user._id,
//         customer_name: user.name,
//         customer_phone: user.mobile,
//       },
//       order_meta: {
//         return_url: `${FRONT
//           .replace("http", "https")
//           }/payment/orders/${orderId}`,
//       },
//     };

//     const response = await fetch("https://api.cashfree.com/pg/orders", {
//       method: "POST",
//       headers: {
//         "x-api-version": "2025-01-01",
//         "x-client-id": ID,
//         "x-client-secret": SECRET,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(orderRequest),
//     });

//     const result = await response.json();

//     if (result.order_status === "ACTIVE") {
//       res.status(200).json({
//         message: "Order created successfully",
//         orderDetails: {
//           orderId: result.order_id,
//           orderAmount: result.order_amount,
//           createdAt: result.created_at,
//           paymentSessionId: result.payment_session_id,
//         },
//       });
//     } else {
//       res.status(400).json({
//         error: "Failed to create order",
//         details: result.message || "Unknown error occurred.",
//       });
//     }
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });
// export default router;
