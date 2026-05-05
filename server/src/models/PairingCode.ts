import mongoose from "mongoose";

const pairingCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB TTL index auto-deletes expired documents
pairingCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PairingCode = mongoose.model("PairingCode", pairingCodeSchema);
