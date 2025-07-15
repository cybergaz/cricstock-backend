import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, unique: true },
  // otp: { type: String },
  isVerified: { type: Boolean, default: false },
  password: { type: String },

  isAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ["marketing", "financial", "super_admin", "user"], default: "user" },

  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true, default: null },

  lastSeen: { type: Date, default: Date.now() },

  profileImage: { type: String },
  amount: { type: Number, default: 0 },

  referredBy: { type: String },
  referralCodes: { type: [String], default: [] },
  totalReferrals: { type: Number },

  transactions: [
    {
      tID: {
        type: String,
      },
      oID: {
        type: String,
      },
      amount: {
        type: Number,
      },
      status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
      },
      type: {
        type: String,
        enum: ["Deposit", "Withdrawal"],
        default: "Deposit"
      },
      method: {
        type: String,
        enum: ["BT", "UPI", "NB", "CC", "DC"],
        default: "UPI",
      },
      txnDate: {
        type: Date,
        default: Date(),
      },
    },
  ],

  // Player Portfolios
  playerPortfolios: [
    {
      matchId: { type: String },
      team: { type: String },

      playerId: { type: String },
      playerName: { type: String },

      quantity: { type: String },
      boughtPrice: { type: String },
      soldPrice: { type: String },
      profit: { type: String },
      profitPercentage: { type: String },
      status: { type: String },
      reason: { type: String },
      timestamp: { type: String },
    },
  ],

  // Team Portfolio
  teamPortfolios: [
    {
      matchId: { type: String },
      team: { type: String },
      teamName: { type: String },

      quantity: { type: String },
      boughtPrice: { type: String },
      soldPrice: { type: String },
      profit: { type: String },
      profitPercentage: { type: String },
      status: { type: String },
      reason: { type: String },
      timestamp: { type: String },
    },
  ],
});

const OtpRequestSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  otp: { type: String },
});


const User = mongoose.model("User", UserSchema);
const OtpRequest = mongoose.model("OTPrequest", OtpRequestSchema);

export { User, OtpRequest };
