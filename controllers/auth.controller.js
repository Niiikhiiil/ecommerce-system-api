import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  isProduction,
  loginSchema,
  registerSchema,
  signAccess,
  signRefresh,
} from "../utils/helpers.js";

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password } = value;
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length)
      return res.status(400).json({ error: "Email already registered" });

    const [[row]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    console.log("row", row);
    const isFirstUser = row.total === 0;

    let role = "user";

    if (isFirstUser) {
      role = "admin";
    } else {
      role = role || "user";
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
      [name, email, hashed, role]
    );
    const user = { id: result.insertId, name, email, role };

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);

    // FOR REFRESH TOKEN WE NEED TO ADD IN DB
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?,?)",
      [user.id, refreshToken]
    );

    // COOKIE AUTHENTICATION
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Registered",
      user: { id: user.id, name, email, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!rows.length)
      return res.status(400).json({ error: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const payloadUser = { id: user.id, email: user.email, role: user.role };
    const accessToken = signAccess(payloadUser);
    const refreshToken = signRefresh(payloadUser);

    // FOR REFRESH TOKEN WE NEED TO ADD IN DB
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?,?)",
      [user.id, refreshToken]
    );

    // COOKIE AUTHENTICATION
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Logged in",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    // CHECK FOR REFRESH TOKEN IS IN DB OR NOT
    const [rows] = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = ?",
      [token]
    );
    if (!rows.length)
      return res.status(401).json({ error: "Invalid refresh token" });

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
      if (err) return res.status(401).json({ error: "Invalid token" });

      const user = { id: payload.id, email: payload.email, role: payload.role };
      console.log("user", user);
      const accessToken = signAccess(user);
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.json({ message: "Access token refreshed" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refresh = req.cookies.refreshToken;
    if (refresh) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = ?", [refresh]);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
