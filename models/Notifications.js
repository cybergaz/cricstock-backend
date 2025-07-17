import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  message: { type: String },
  date: { type: Number },
  userType: { type: String, enum: ["all", "users_in_loss", "users_in_profit", "today_login", "new_users", "inactive_users", "admins"], default: "all" },
});


const Notifications = mongoose.model("Notifications", NotificationSchema);

export { Notifications };
