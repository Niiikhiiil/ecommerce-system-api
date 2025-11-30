import Joi from "joi";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const isProduction = process.env.NODE_ENVIRONMENT === "production";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("user", "admin").default("user"),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("", null),
  price: Joi.number().precision(2).min(0).required(),
  stock: Joi.number().integer().min(1).required(),
});

export const addToCartSchema = Joi.object({
  productId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const removeFromCartSchema = Joi.object({
  cartItemId: Joi.number().integer().required(),
});

export const signAccess = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
  );
};

export const signRefresh = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    }
  );
};

export const ensureCart = async (userId) => {
  const [rows] = await pool.query("SELECT * FROM carts WHERE user_id = ?", [
    userId,
  ]);

  if (rows.length) return rows[0];

  const [res] = await pool.query("INSERT INTO carts (user_id) VALUES (?)", [
    userId,
  ]);

  const [newRows] = await pool.query("SELECT * FROM carts WHERE id = ?", [
    res.insertId,
  ]);

  return newRows[0];
};
