const express = require("express");
const { get, run } = require("../database/db");
const paymentConfig = require("../payment_config");

const router = express.Router();
const culqi = paymentConfig.culqi;

function planAmount(plan) {
  return Math.round(plan.price * 100);
}

router.get("/plans", (req, res) => {
  res.json({ plans: paymentConfig.plans, currency: culqi.currency, provider: "culqi" });
});

router.post("/checkout/culqi", async (req, res) => {
  try {
    if (!culqi.isConfigured()) {
      return res.status(503).json({
        error: "Los pagos aún no están configurados. Falta CULQI_PUBLIC_KEY y CULQI_SECRET_KEY en el archivo .env",
      });
    }

    const { planId } = req.body || {};
    const plan = paymentConfig.plans.find((p) => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Plan no encontrado" });

    const amount = planAmount(plan);
    const result = await run(
      "INSERT INTO transactions (user_id, type, amount, description, provider, status) VALUES (?, 'deposit', ?, ?, 'culqi', 'pending')",
      [req.user.id, amount, `Compra de ${plan.credits} créditos (${plan.label})`]
    );

    res.json({
      transactionId: result.lastInsertRowid,
      amount,
      currency: culqi.currency,
      description: `MysteryBox - ${plan.label} (${plan.credits} créditos)`,
      publicKey: culqi.publicKey,
      plan,
    });
  } catch (err) {
    console.error("checkout culqi:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/confirm/culqi", async (req, res) => {
  try {
    if (!culqi.isConfigured()) {
      return res.status(503).json({ error: "Los pagos aún no están configurados" });
    }

    const { transactionId, token } = req.body || {};
    if (typeof token !== "string" || !token.startsWith("tkn_")) {
      return res.status(400).json({ error: "Token de pago inválido" });
    }

    const tx = await get("SELECT * FROM transactions WHERE id = ? AND user_id = ?", [
      transactionId,
      req.user.id,
    ]);
    if (!tx) return res.status(404).json({ error: "Orden de pago no encontrada" });

    if (tx.status === "completed") {
      const user = await get("SELECT credits FROM users WHERE id = ?", [req.user.id]);
      return res.json({ success: true, alreadyProcessed: true, newBalance: user.credits });
    }

    const plan = paymentConfig.plans.find((p) => planAmount(p) === tx.amount);
    if (!plan) return res.status(500).json({ error: "Plan no encontrado para esta orden" });

    const user = await get("SELECT email FROM users WHERE id = ?", [req.user.id]);

    const chargeResponse = await fetch(`${culqi.apiBase}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${culqi.secretKey}`,
      },
      body: JSON.stringify({
        amount: tx.amount,
        currency_code: culqi.currency,
        email: user.email,
        source_id: token,
        description: tx.description,
        metadata: {
          transaction_id: String(tx.id),
          user_id: String(req.user.id),
          plan_id: plan.id,
        },
      }),
    });

    const charge = await chargeResponse.json().catch(() => ({}));
    if (!chargeResponse.ok || charge.paid !== true) {
      const message =
        charge.user_message || charge.merchant_message || "El pago fue rechazado por Culqi";
      console.warn("culqi charge rejected:", chargeResponse.status, charge.type || charge);
      return res.status(402).json({ error: message });
    }

    await run("UPDATE transactions SET status = 'completed', provider_tx_id = ? WHERE id = ?", [
      charge.id || null,
      tx.id,
    ]);
    await run("UPDATE users SET credits = credits + ? WHERE id = ?", [plan.credits, req.user.id]);

    const updated = await get("SELECT credits FROM users WHERE id = ?", [req.user.id]);
    res.json({
      success: true,
      newBalance: updated.credits,
      credits: plan.credits,
      chargeId: charge.id,
    });
  } catch (err) {
    console.error("confirm culqi:", err);
    res.status(502).json({ error: "No se pudo completar el pago. Inténtalo de nuevo." });
  }
});

module.exports = router;
