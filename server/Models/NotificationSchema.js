const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  // later 'type' field if I want (e.g. 'schedule', 'announcement', etc.)
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);