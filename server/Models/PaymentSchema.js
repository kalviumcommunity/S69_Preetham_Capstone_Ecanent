const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  transactionId: { type: String, unique: true },
}, { timestamps: true });

export default mongoose.model("Payment",paymentSchema)