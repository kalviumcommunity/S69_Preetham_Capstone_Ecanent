const mongoose = require("mongoose");

const videoCallSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  callType: { type: String, enum: ["voice", "video"], default: "video" },
  callStatus: { type: String, enum: ["ongoing", "missed", "ended"], default: "ongoing" },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
}, { timestamps: true });

export default mongoose.model("VideoCall",videoCallSchema)