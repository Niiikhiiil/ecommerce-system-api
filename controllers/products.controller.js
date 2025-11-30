import pool from "../config/db.js";
import { createProductSchema } from "../utils/helpers.js";

export const createProduct = async (req, res) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, description, price, stock } = value;
    const [result] = await pool.query(
      "INSERT INTO products (name,description,price,stock) VALUES (?,?,?,?)",
      [name, description, price, stock]
    );
    res.json({ message: "Product created", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
