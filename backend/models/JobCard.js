import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

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
  mrp: {
    type: Number,
    required: true,
  },
  image: {
    type: String, // Store base64 image or URL
    required: false,
  },
  variants: {
    type: [variantSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

jobCardSchema.index({ designNumber: 1, brand: 1 });

export default mongoose.model("JobCard", jobCardSchema);
