const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  content: { type: String },
  messageType: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
}, { timestamps: true });

export default mongoose.model("Message",messageSchema)