const express = require("express");
const { get, all, run } = require("../database/db");
const paymentConfig = require("../payment_config");

const router = express.Router();

router.get("/plans", (req, res) => {
  res.json({ plans: paymentConfig.plans });
});

router.post("/checkout/stripe", async (req, res) => {
  try {
    if (!paymentConfig.stripe.enabled) {
      return res.status(400).json({ error: "Stripe no está habilitado" });
    }
    const { planId } = req.body;
    const plan = paymentConfig.plans.find((p) => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Plan no encontrado" });

    const result = await run(
      "INSERT INTO transactions (user_id, type, amount, description, provider, status) VALUES (?, 'deposit', ?, ?, 'stripe', 'pending')",
      [req.user.id, Math.round(plan.price * 100), `Buy ${plan.credits} credits (${plan.label})`]
    );

    res.json({
      clientSecret: `pi_demo_${result.lastInsertRowid}`,
      transactionId: result.lastInsertRowid,
      plan,
      message: "Integra Stripe Checkout o Payment Intents aquí con tu publishableKey",
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/checkout/mercadopago", async (req, res) => {
  try {
    if (!paymentConfig.mercadopago.enabled) {
      return res.status(400).json({ error: "MercadoPago no está habilitado" });
    }
    const { planId } = req.body;
    const plan = paymentConfig.plans.find((p) => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Plan no encontrado" });

    const result = await run(
      "INSERT INTO transactions (user_id, type, amount, description, provider, status) VALUES (?, 'deposit', ?, ?, 'mercadopago', 'pending')",
      [req.user.id, Math.round(plan.price * 100), `Buy ${plan.credits} credits (${plan.label})`]
    );

    res.json({
      init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=demo_${result.lastInsertRowid}`,
      transactionId: result.lastInsertRowid,
      plan,
      message: "Integra MercadoPago Preference SDK aquí con tu accessToken",
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

async function handleStripeWebhook(req, res) {
  try {
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (event.type === "payment_intent.succeeded") {
      const txId = event.data.object?.metadata?.transaction_id;
      if (txId) {
        const tx = await get("SELECT * FROM transactions WHERE id = ? AND status = 'pending'", [txId]);
        if (tx) {
          const plan = paymentConfig.plans.find((p) => Math.round(p.price * 100) === tx.amount);
          const creditsToAdd = plan ? plan.credits : Math.floor(tx.amount / 100);
          await run("UPDATE transactions SET status = 'completed' WHERE id = ?", [txId]);
          await run("UPDATE users SET credits = credits + ? WHERE id = ?", [creditsToAdd, tx.user_id]);
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: "Webhook error" });
  }
}

async function handleMPWebhook(req, res) {
  try {
    const { type, data } = req.body;
    if (type === "payment") {
      const txId = data?.id;
      if (txId) {
        const tx = await get("SELECT * FROM transactions WHERE (provider_tx_id = ? OR id = ?) AND status = 'pending'", [String(txId), txId]);
        if (tx) {
          const plan = paymentConfig.plans.find((p) => Math.round(p.price * 100) === tx.amount);
          const creditsToAdd = plan ? plan.credits : Math.floor(tx.amount / 100);
          await run("UPDATE transactions SET status = 'completed' WHERE id = ?", [tx.id]);
          await run("UPDATE users SET credits = credits + ? WHERE id = ?", [creditsToAdd, tx.user_id]);
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: "Webhook error" });
  }
}

module.exports = router;
module.exports.handleStripeWebhook = handleStripeWebhook;
module.exports.handleMPWebhook = handleMPWebhook;
