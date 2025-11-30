import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
      if (err) return res.status(401).json({ error: "Invalid access token" });

      // OPTIONALLY GET USER
      const [rows] = await pool.query(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [payload.id]
      );

      if (!rows.length)
        return res.status(401).json({ error: "User not found" });

      req.user = rows[0];

      next();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const requireAdmin = (req, res, next) => {
  console.log(req);
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
