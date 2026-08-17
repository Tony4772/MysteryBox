require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { authMiddleware, adminMiddleware } = require("./middleware/auth");
const { initDB } = require("./database/db");

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const boxRoutes = require("./routes/boxes");
const inventoryRoutes = require("./routes/inventory");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");

async function start() {
  await initDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  // Public routes
  app.use("/api/auth", authRoutes);

  // Payment webhooks (no auth required - must come first)
  app.post("/api/payments/webhook/stripe", paymentRoutes.handleStripeWebhook);
  app.post("/api/payments/webhook/mercadopago", paymentRoutes.handleMPWebhook);
  app.get("/api/payments/plans", (req, res) => paymentRoutes.handlePlans ? paymentRoutes.handlePlans(req, res) : res.json({ plans: require("./payment_config").plans }));

  // Protected routes
  app.use("/api/wallet", authMiddleware, walletRoutes);
  app.use("/api/boxes", authMiddleware, boxRoutes);
  app.use("/api/inventory", authMiddleware, inventoryRoutes);
  app.use("/api/payments", authMiddleware, paymentRoutes);

  // Admin routes
  app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);

  // SPA fallback
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API not found" });
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`\n  ======================================`);
    console.log(`     MysteryBox Server Running`);
    console.log(`     http://localhost:${PORT}`);
    console.log(`  ======================================\n`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
