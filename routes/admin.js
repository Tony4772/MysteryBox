const express = require("express");
const { get, all, run } = require("../database/db");

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = (await get("SELECT COUNT(*) as count FROM users")).count;
    const totalRevenue = (await get("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'deposit' AND status = 'completed'")).total;
    const totalOpens = (await get("SELECT COUNT(*) as count FROM open_history")).count;
    const totalCreditsSpent = (await get("SELECT COALESCE(SUM(credits_spent), 0) as total FROM open_history")).total;
    const recentDeposits = await all(`
      SELECT u.username, t.amount, t.created_at, t.status
      FROM transactions t JOIN users u ON t.user_id = u.id
      WHERE t.type = 'deposit'
      ORDER BY t.created_at DESC LIMIT 20
    `);
    const rarityStats = await all(`
      SELECT r.name as rarity, r.color, COUNT(*) as count
      FROM open_history oh
      JOIN items i ON oh.item_id = i.id
      JOIN rarity_tiers r ON i.rarity_tier_id = r.id
      GROUP BY r.id
    `);

    res.json({ totalUsers, totalRevenue, totalOpens, totalCreditsSpent, recentDeposits, rarityStats });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await all("SELECT id, username, email, credits, role, created_at FROM users ORDER BY created_at DESC");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { credits, role } = req.body;
    if (credits !== undefined) {
      await run("UPDATE users SET credits = ? WHERE id = ?", [credits, req.params.id]);
    }
    if (role !== undefined) {
      await run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    }
    const user = await get("SELECT id, username, email, credits, role FROM users WHERE id = ?", [req.params.id]);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/probabilities", async (req, res) => {
  try {
    const data = await all(`
      SELECT rt.id, rt.name, rt.color, rt.probability, bt.name as box_name, bt.id as box_type_id
      FROM rarity_tiers rt
      JOIN box_types bt ON rt.box_type_id = bt.id
      ORDER BY bt.id, rt.probability DESC
    `);
    res.json({ tiers: data });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.put("/probabilities/:tierId", async (req, res) => {
  try {
    const { probability } = req.body;
    if (probability === undefined || probability < 0 || probability > 1) {
      return res.status(400).json({ error: "Probabilidad inválida (0-1)" });
    }

    const tier = await get("SELECT * FROM rarity_tiers WHERE id = ?", [req.params.tierId]);
    if (!tier) return res.status(404).json({ error: "Tier no encontrado" });

    const siblings = await all("SELECT id, probability FROM rarity_tiers WHERE box_type_id = ?", [tier.box_type_id]);
    const othersSum = siblings.filter((s) => s.id !== tier.id).reduce((acc, s) => acc + s.probability, 0);
    if (probability + othersSum > 1.01) {
      return res.status(400).json({ error: `Las probabilidades no pueden exceder 100%. Suma de otros: ${(othersSum * 100).toFixed(1)}%` });
    }

    await run("UPDATE rarity_tiers SET probability = ? WHERE id = ?", [probability, req.params.tierId]);
    res.json({ message: "Probabilidad actualizada", tier: { ...tier, probability } });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/boxes", async (req, res) => {
  try {
    const boxes = await all("SELECT * FROM box_types");
    res.json({ boxes });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.put("/boxes/:id", async (req, res) => {
  try {
    const { cost, active, name } = req.body;
    if (cost !== undefined) await run("UPDATE box_types SET cost = ? WHERE id = ?", [cost, req.params.id]);
    if (active !== undefined) await run("UPDATE box_types SET active = ? WHERE id = ?", [active ? 1 : 0, req.params.id]);
    if (name !== undefined) await run("UPDATE box_types SET name = ? WHERE id = ?", [name, req.params.id]);
    const box = await get("SELECT * FROM box_types WHERE id = ?", [req.params.id]);
    res.json({ box });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
