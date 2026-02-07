import express from "express";
import upload from "../config/multer.js";
import {
  createJobCard,
  createMultipleJobCards,
  getAllJobCards,
  getJobCardById,
  updateJobCard,
  deleteJobCard,
  searchJobCards,
} from "../controllers/jobCard.controller.js";

const router = express.Router();

// Routes with image upload support
router.post("/", upload.single('image'), createJobCard);
router.post("/bulk", createMultipleJobCards);
router.get("/", getAllJobCards);
router.get("/search", searchJobCards);
router.get("/:id", getJobCardById);
router.patch("/:id", upload.single('image'), updateJobCard);
router.delete("/:id", deleteJobCard);

export default router;
