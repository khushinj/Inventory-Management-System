import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    emailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["shop", "domestic", "ecommerce"], required: true },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);