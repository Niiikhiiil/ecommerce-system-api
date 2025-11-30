import express from "express";
import {
  createProduct,
  getProducts,
} from "../controllers/products.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", requireAuth, requireAdmin, createProduct);

export default router;
