const express = require("express");
const { get, all } = require("../database/db");

const router = express.Router();

router.get("/balance", async (req, res) => {
  try {
    const user = await get("SELECT credits FROM users WHERE id = ?", [req.user.id]);
    res.json({ credits: user.credits });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const txs = await all("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [req.user.id]);
    res.json({ transactions: txs });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
