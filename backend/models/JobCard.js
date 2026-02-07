import mongoose from "mongoose";

const jobCardSchema = new mongoose.Schema({
  designNumber: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  fabric: {
    type: String,
    required: true,
    trim: true,
  },
  fabricComposition: {
    type: String,
    required: true,
    trim: true,
  },
  gsm: {
    type: Number,
    required: true,
  },
  mrp: {
    type: Number,
    required: true,
  },
  image: {
    type: String, // Store Cloudinary URL (or base64 for backwards compatibility)
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

jobCardSchema.index({ designNumber: 1, brand: 1 });

export default mongoose.model("JobCard", jobCardSchema);
