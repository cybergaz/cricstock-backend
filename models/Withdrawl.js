import mongoose from "mongoose";

const WithdrawlSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  bankName: { type: String, required: true },
  phone: { type: String, required: true },
  aadhar: { type: String, required: false },
  pan: { type: String, required: false },
  orderId: { type: String, required: true },
  userMobile: { type: String, required: true }
}, { timestamps: true });

const Withdrawl = mongoose.model("Withdrawl", WithdrawlSchema);

export default Withdrawl;
