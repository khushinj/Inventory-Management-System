import JobCard from "../models/JobCard.js";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId, isBase64Image } from "../utils/cloudinaryUpload.js";
import { normalizeDesignNumber } from "../utils/normalization.js";

// Create a new job card entry
export const createJobCard = async (req, res) => {
  try {
    let imageUrl = null;
    
    // Handle image upload
    if (req.file) {
      // If file is uploaded via multer
      imageUrl = req.file.path; // Cloudinary URL from multer-storage-cloudinary
    } else if (req.body.image && isBase64Image(req.body.image)) {
      // If base64 image is sent in request body (backwards compatibility)
      const uploadResult = await uploadToCloudinary(req.body.image, 'jobcards');
      imageUrl = uploadResult.url;
    }
    
    // Parse cutting data if it's a JSON string
    let cuttingData = req.body.cutting;
    if (typeof cuttingData === 'string') {
      try {
        cuttingData = JSON.parse(cuttingData);
      } catch (e) {
        console.error('Error parsing cutting data:', e);
        cuttingData = [];
      }
    }
    
    const jobCardData = {
      ...req.body,
      image: imageUrl || req.body.image,
      cutting: cuttingData || []
    };
    
    const jobCard = await JobCard.create(jobCardData);
    res.status(201).json(jobCard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create multiple job card entries at once
export const createMultipleJobCards = async (req, res) => {
  try {
    const { jobCards } = req.body;
    
    if (!Array.isArray(jobCards) || jobCards.length === 0) {
      return res.status(400).json({ error: "Job cards array is required" });
    }

    const createdJobCards = await JobCard.insertMany(jobCards);
    res.status(201).json(createdJobCards);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all job card entries
export const getAllJobCards = async (req, res) => {
  try {
    const jobCards = await JobCard.find().sort({ createdAt: -1 });
    res.json(jobCards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single job card entry by ID
export const getJobCardById = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id);
    if (!jobCard) {
      return res.status(404).json({ error: "Job card not found" });
    }
    res.json(jobCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a job card entry
export const updateJobCard = async (req, res) => {
  try {
    const existingJobCard = await JobCard.findById(req.params.id);
    
    if (!existingJobCard) {
      return res.status(404).json({ error: "Job card not found" });
    }
    
    let imageUrl = existingJobCard.image;
    
    // Handle image upload
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (existingJobCard.image) {
        const publicId = extractPublicId(existingJobCard.image);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(err => 
            console.error('Failed to delete old image:', err)
          );
        }
      }
      imageUrl = req.file.path; // New Cloudinary URL
    } else if (req.body.image && isBase64Image(req.body.image)) {
      // Delete old image from Cloudinary if it exists
      if (existingJobCard.image) {
        const publicId = extractPublicId(existingJobCard.image);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch(err => 
            console.error('Failed to delete old image:', err)
          );
        }
      }
      // Upload new base64 image
      const uploadResult = await uploadToCloudinary(req.body.image, 'jobcards');
      imageUrl = uploadResult.url;
    }
    
    // Parse cutting data if it's a JSON string (for FormData)
    let cuttingData = req.body.cutting;
    if (typeof cuttingData === 'string') {
      try {
        cuttingData = JSON.parse(cuttingData);
      } catch (e) {
        console.error('Error parsing cutting data:', e);
        cuttingData = existingJobCard.cutting || [];
      }
    }
    
    const updateData = {
      ...req.body,
      image: imageUrl,
      cutting: cuttingData !== undefined ? cuttingData : existingJobCard.cutting
    };
    
    const jobCard = await JobCard.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json(jobCard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a job card entry
export const deleteJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id);
    
    if (!jobCard) {
      return res.status(404).json({ error: "Job card not found" });
    }
    
    // Delete image from Cloudinary if it exists
    if (jobCard.image) {
      const publicId = extractPublicId(jobCard.image);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(err => 
          console.error('Failed to delete image from Cloudinary:', err)
        );
      }
    }
    
    await JobCard.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Job card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search job cards by design number or brand
export const searchJobCards = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    // Normalize the design number for comparison
    const normalizedQuery = normalizeDesignNumber(query);
    
    const jobCards = await JobCard.find({
      $or: [
        { designNumber: { $regex: normalizedQuery, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { fabric: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });
    
    res.json(jobCards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
