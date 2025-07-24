import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import http from "http";
import cookieParser from 'cookie-parser';
import cron from "node-cron";
import { competitions, scorecards, todays } from "./services/cricket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://www.cricstock11.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
  })
);
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
  })
);

const MONGO_URI =
  process.env.MONGO_URI

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[DB] : Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoute from "./routes/paymentRoute.js"
import portfolioRoute from "./routes/portfolioRoute.js"
import adminRoute from "./routes/adminRoutes.js"
import cricketRoute from "./routes/cricketRoute.js";
import emailRoute from "./routes/emailRoute.js";
import userRoute from "./routes/userRoute.js";

app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/portfolio", portfolioRoute);
app.use("/payment", paymentRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute)
app.use("/admin", adminRoute)
app.use("/email", emailRoute)
app.use("/cricket", cricketRoute);

// Root Route
app.get("/", (req, res) => {
  res.send("Cricket Betting App API is running...");
});

cron.schedule('0 0 * * 0', () => {
  competitions()
});

cron.schedule('*/60 * * * * *', async () => {
  todays()
});

cron.schedule('*/5 * * * * *', async () => {
  scorecards()
});

// function scheduleTodaysCheck(fallbackMs = 10 * 60 * 1000) {
//   (async () => {
//     const now = new Date();
//     const pad = (n) => n.toString().padStart(2, '0');
//     const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
//     let result;
//     try {
//       result = await todays();
//     } catch (e) {
//       console.error('[TODAYS] Error in scheduled check:', e);
//       setTimeout(() => scheduleTodaysCheck(fallbackMs), fallbackMs);
//       return;
//     }
//     if (!result || !Array.isArray(result) || result.length === 0) {
//       setTimeout(() => scheduleTodaysCheck(fallbackMs), fallbackMs);
//       return;
//     }
//     // Find the soonest valid match time in the future
//     const nowTime = getTimeFromString(todayDateStr);
//     const futureTimes = result
//       .map(getTimeFromString)
//       .filter(t => t && t > nowTime)
//       .sort((a, b) => a - b);
//     if (futureTimes.length === 0) {
//       setTimeout(() => scheduleTodaysCheck(fallbackMs), fallbackMs);
//       return;
//     }
//     const nextMatchTime = futureTimes[0];
//     const msUntilNext = nextMatchTime - nowTime;
//     const msToWait = Math.max(msUntilNext - 60 * 1000, 0);
//     setTimeout(() => scheduleTodaysCheck(fallbackMs), msToWait);
//     const nextDate = new Date(now.getTime() + msToWait);
//     console.log(`[SR] Next Match At : ${nextDate.toLocaleString()}`);
//   })();
// }
// scheduleTodaysCheck()

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[SR] : Connected : ${PORT}`);
});
