const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["admin", "member"]);

const buildToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const normalizedRole = role || "member";
    if (!VALID_ROLES.has(normalizedRole)) {
      return res
        .status(400)
        .json({ error: "Role must be either 'admin' or 'member'" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase(), hashedPassword, normalizedRole]
    );

    const user = result.rows[0];
    const token = buildToken(user);

    return res.status(201).json({
      data: { token, user },
      message: "User registered successfully",
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT id, name, email, password, role, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
    const token = buildToken(safeUser);

    return res.json({
      data: { token, user: safeUser },
      message: "Login successful",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to login" });
  }
});

module.exports = router;
