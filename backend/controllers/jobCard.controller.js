import JobCard from "../models/JobCard.js";

// Create a new job card entry
export const createJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.create(req.body);
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
    const jobCard = await JobCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!jobCard) {
      return res.status(404).json({ error: "Job card not found" });
    }
    
    res.json(jobCard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a job card entry
export const deleteJobCard = async (req, res) => {
  try {
    const jobCard = await JobCard.findByIdAndDelete(req.params.id);
    
    if (!jobCard) {
      return res.status(404).json({ error: "Job card not found" });
    }
    
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
    
    const jobCards = await JobCard.find({
      $or: [
        { designNumber: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { fabric: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });
    
    res.json(jobCards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
