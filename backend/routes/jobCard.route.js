import express from "express";
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

router.post("/", createJobCard);
router.post("/bulk", createMultipleJobCards);
router.get("/", getAllJobCards);
router.get("/search", searchJobCards);
router.get("/:id", getJobCardById);
router.patch("/:id", updateJobCard);
router.delete("/:id", deleteJobCard);

export default router;
