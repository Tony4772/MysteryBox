const express = require("express");
const { get, all } = require("../database/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const items = await all(`
      SELECT i.id, i.name, i.description, i.image, r.name as rarity, r.color, b.name as box_name
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      JOIN rarity_tiers r ON i.rarity_tier_id = r.id
      JOIN box_types b ON i.box_type_id = b.id
      WHERE inv.user_id = ?
      ORDER BY inv.obtained_at DESC
    `, [req.user.id]);
    res.json({ inventory: items });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const totalRow = await get("SELECT COUNT(*) as count FROM inventory WHERE user_id = ?", [req.user.id]);
    const total = totalRow ? totalRow.count : 0;
    const byRarity = await all(`
      SELECT r.name as rarity, r.color, COUNT(*) as count
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      JOIN rarity_tiers r ON i.rarity_tier_id = r.id
      WHERE inv.user_id = ?
      GROUP BY r.id
    `, [req.user.id]);
    res.json({ total, byRarity });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
