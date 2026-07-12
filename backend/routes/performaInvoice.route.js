import express from "express";
import { saveProformaInvoice } from "../controllers/performaInvoice.controller.js";

const router = express.Router();

router.post("/", saveProformaInvoice);

export default router;
