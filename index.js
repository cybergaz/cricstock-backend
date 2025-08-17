import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import http from "http";
import cookieParser from 'cookie-parser';
import cron from "node-cron";

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoute from "./routes/paymentRoute.js"
import portfolioRoute from "./routes/portfolioRoute.js"
import adminRoute from "./routes/adminRoutes.js"
import cricketRoute from "./routes/cricketRoute.js";
import emailRoute from "./routes/emailRoute.js";
import userRoute from "./routes/userRoute.js";
import Competitions from "./models/Competitions.js";
import Todays from "./models/Todays.js";
import { fetchLiveCompetitions } from "./services/competitions.js";
import { fetchTodayMatches } from "./services/match-list.js";
import { connectToThirdPartySocket, setupWebSocketServer } from "./services/websocket-client.js";
import { setupPortfolioSockets } from "./services/portfolio-socket.js";


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
  .then(() => {
    console.log("[DB] : Connected");

    // Setup WebSocket handlers
    const socketPort = process.env.SOCKET_PORT || 3001;
    setupWebSocketServer(socketPort);
    // setupPortfolioSockets(wss);
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

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

cron.schedule('0 0 * * *', async () => {
  await Competitions.deleteMany({});
  fetchLiveCompetitions("fixture")
  fetchLiveCompetitions("live")
});

cron.schedule('*/5 * * * * *', async () => {
  // console.log("deleted todays matches");
  fetchTodayMatches()
});

// cron.schedule('*/2 * * * * *', async () => {
// scorecards()
// });

const PORT = process.env.SERVER_PORT || 5000;
server.listen(PORT, () => {
  console.log(`[SERVER] : Live @ ${PORT}`);
  // Connect to third-party WebSocket after server starts
  connectToThirdPartySocket();
});
