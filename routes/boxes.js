const express = require("express");
const { get, all, run } = require("../database/db");

const router = express.Router();

router.get("/types", async (req, res) => {
  try {
    const boxes = await all("SELECT * FROM box_types WHERE active = 1");
    res.json({ boxes });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/types/:id", async (req, res) => {
  try {
    const box = await get("SELECT * FROM box_types WHERE id = ? AND active = 1", [req.params.id]);
    if (!box) return res.status(404).json({ error: "Caja no encontrada" });
    const tiers = await all("SELECT * FROM rarity_tiers WHERE box_type_id = ?", [req.params.id]);
    const items = await all(`
      SELECT i.*, r.name as rarity_name, r.color, r.probability
      FROM items i
      JOIN rarity_tiers r ON i.rarity_tier_id = r.id
      WHERE i.box_type_id = ?
    `, [req.params.id]);
    res.json({ box, tiers, items });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/open/:id", async (req, res) => {
  try {
    const box = await get("SELECT * FROM box_types WHERE id = ? AND active = 1", [req.params.id]);
    if (!box) return res.status(404).json({ error: "Caja no encontrada" });

    const user = await get("SELECT credits FROM users WHERE id = ?", [req.user.id]);
    if (user.credits < box.cost) {
      return res.status(400).json({ error: "Créditos insuficientes", needed: box.cost, current: user.credits });
    }

    const tiers = await all("SELECT * FROM rarity_tiers WHERE box_type_id = ?", [box.id]);
    const roll = Math.random();
    let cumulative = 0;
    let selectedTier = tiers[tiers.length - 1];
    for (const tier of tiers) {
      cumulative += tier.probability;
      if (roll < cumulative) {
        selectedTier = tier;
        break;
      }
    }

    const tierItems = await all("SELECT * FROM items WHERE rarity_tier_id = ? AND box_type_id = ?", [selectedTier.id, box.id]);
    if (tierItems.length === 0) {
      return res.status(500).json({ error: "No hay items disponibles para esta rareza" });
    }
    const wonItem = tierItems[Math.floor(Math.random() * tierItems.length)];

    await run("UPDATE users SET credits = credits - ? WHERE id = ?", [box.cost, req.user.id]);
    await run("INSERT INTO inventory (user_id, item_id) VALUES (?, ?)", [req.user.id, wonItem.id]);
    await run("INSERT INTO open_history (user_id, box_type_id, item_id, credits_spent) VALUES (?, ?, ?, ?)", [req.user.id, box.id, wonItem.id, box.cost]);
    await run("INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, 'spend', ?, ?, 'completed')", [req.user.id, -box.cost, `Opened ${box.name}`]);

    const updatedUser = await get("SELECT credits FROM users WHERE id = ?", [req.user.id]);
    res.json({
      item: {
        id: wonItem.id,
        name: wonItem.name,
        description: wonItem.description,
        image: wonItem.image,
        rarity: selectedTier.name,
        color: selectedTier.color,
      },
      creditsSpent: box.cost,
      newBalance: updatedUser.credits,
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor: " + err.message });
  }
});

module.exports = router;
