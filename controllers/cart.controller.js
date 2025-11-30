import pool from "../config/db.js";
import {
  addToCartSchema,
  ensureCart,
  removeFromCartSchema,
} from "../utils/helpers.js";

export const addToCart = async (req, res) => {
  try {
    const { error, value } = addToCartSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { productId, quantity } = value;

    // CHECKING PRODUCT IS EXISTS AND IT'S STOCK
    const [prodRows] = await pool.query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);

    if (!prodRows.length)
      return res.status(404).json({ error: "Product not found" });

    const product = prodRows[0];

    if (product.stock < quantity)
      return res.status(400).json({ error: "Not enough stock" });

    //CHECK CART CREATED FOR USER OR NOT, IF NOT THEN IT WILL CREATE CART OR RETURN ALREADY CREATED
    const cart = await ensureCart(req.user.id);

    // CHECK IF THIS ITEM IS EXISTED IN CART
    const [itemRows] = await pool.query(
      "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cart.id, productId]
    );

    if (itemRows.length) {
      await pool.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
        [quantity, itemRows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?)",
        [cart.id, productId, quantity]
      );
    }

    res.json({ message: "Added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const viewCart = async (req, res) => {
  try {
    const cart = await ensureCart(req.user.id);
    const [items] = await pool.query(
      `SELECT 
      ci.id as cart_item_id, 
      p.id as product_id, 
      p.name,
      p.description,
      p.price,
      ci.quantity
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?`,
      [cart.id]
    );

    let total = 0;
    const mapped = items.map((i) => {
      const line = Number(i.price) * i.quantity;
      total += line;
      return {
        cart_item_id: i.cart_item_id,
        product_id: i.product_id,
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
        lineTotal: Number(line.toFixed(2)),
      };
    });

    res.json({ items: mapped, total: Number(total.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { error, value } = removeFromCartSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { cartItemId } = value;

    //CHECK CART CREATED FOR USER OR NOT, IF NOT THEN IT WILL CREATE CART OR RETURN ALREADY CREATED
    const cart = await ensureCart(req.user.id);

    const [rows] = await pool.query(
      "SELECT * FROM cart_items WHERE id = ? AND cart_id = ?",
      [cartItemId, cart.id]
    );

    if (!rows.length)
      return res.status(404).json({ error: "Cart item not found" });

    await pool.query("DELETE FROM cart_items WHERE id = ?", [cartItemId]);
    res.json({ message: "Item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const checkout = async (req, res) => {
  try {
    const cart = await ensureCart(req.user.id);
    const [items] = await pool.query(
      `SELECT 
      ci.id as cart_item_id,
      p.id as product_id,
      p.name,
      p.price,
      p.stock,
      ci.quantity
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?`,
      [cart.id]
    );

    if (!items.length) return res.status(400).json({ error: "Cart is empty" });

    // VALIDATE STOCK AND CALCULATE TOTAL
    let total = 0;
    for (const it of items) {
      if (it.stock < it.quantity)
        return res
          .status(400)
          .json({ error: `Not enough stock for product ${it.name}` });
      total += Number(it.price) * it.quantity;
    }

    // CREATE ORDER
    const [orderRes] = await pool.query(
      "INSERT INTO orders (user_id, total) VALUES (?,?)",
      [req.user.id, total.toFixed(2)]
    );
    const orderId = orderRes.insertId;

    // INSERT ORDER ITEMS AND REDUCE STOCK
    for (const it of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)",
        [orderId, it.product_id, it.quantity, it.price]
      );
      await pool.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
        it.quantity,
        it.product_id,
      ]);
    }

    // CLEAR CART ITEMS
    await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);

    res.json({
      message: "Checkout successful",
      orderId,
      total: Number(total.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
