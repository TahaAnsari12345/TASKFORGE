const express = require("express");
const { pool } = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users ORDER BY name ASC"
    );
    return res.json({
      data: result.rows,
      message: "Users fetched successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    return res.json({
      data: req.user,
      message: "Current user fetched successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
});

module.exports = router;
