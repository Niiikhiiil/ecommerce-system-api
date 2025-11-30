import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  checkout,
  removeFromCart,
  viewCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/add", requireAuth, addToCart);
router.get("/", requireAuth, viewCart);
router.delete("/remove", requireAuth, removeFromCart);
router.post("/checkout", requireAuth, checkout);

export default router;
