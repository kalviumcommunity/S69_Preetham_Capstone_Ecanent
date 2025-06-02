import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  content: { type: String, required: true },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  classGroup: { type: mongoose.Schema.Types.ObjectId, ref: "ClassGroup" },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification",notificationSchema)