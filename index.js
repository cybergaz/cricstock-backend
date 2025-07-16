import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import http from "http";
import { initializeSocket } from "./SocketService/socket.js";
import cookieParser from 'cookie-parser';


dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "https://www.cricstock11.com",
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true,
    allowedHeaders: ["Content-type", "Authorization", "Set-Cookie"],
  })
);
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
  })
);



// Connect to MongoDB

const MONGO_URI =
  process.env.MONGO_URI

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[DB] : Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Import routes after initializing socket.io
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoute from "./routes/paymentRoute.js"
import portfolioRoute from "./routes/portfolio.route.js"
import adminRoute from "./routes/adminRoutes.js"
import emailService from "./routes/emailSevice.js";
import cricketRoute from "./routes/cricketRoute.js";
import userRoute from "./routes/userRoute.js";

// Define Routes
app.use("/auth", authRoutes);
// app.use("/matches", matchRoutes);
// app.use("/match-scores", matchScores);
app.use("/upload", uploadRoutes);
// app.use("/portfolio", portfolioRoute);
app.use("/portfolio", portfolioRoute);
app.use("/payment", paymentRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute)
// app.use("/api", emailService);
app.use("/cricket", cricketRoute);

// Root Route
app.get("/", (req, res) => {
  res.send("Cricket Betting App API is running...");
});


// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // startTrackingUserPortfolioMatches();
  console.log(`[SR] : Connected : ${PORT}`);
});
