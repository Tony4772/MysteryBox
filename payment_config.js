/**
 * payment_config.js
 * ─────────────────────────────────────────────────
 * Configuración de pasarelas de pago.
 * Inserta tus API Keys aquí SIN modificar el código central.
 * ─────────────────────────────────────────────────
 */

module.exports = {
  stripe: {
    enabled: true,
    secretKey: process.env.STRIPE_SECRET_KEY || "sk_test_YOUR_STRIPE_SECRET_KEY",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_YOUR_WEBHOOK_SECRET",
    currency: "usd",
  },

  mercadopago: {
    enabled: false,
    accessToken: process.env.MP_ACCESS_TOKEN || "TEST-YOUR_MP_ACCESS_TOKEN",
    publicKey: process.env.MP_PUBLIC_KEY || "TEST-YOUR_MP_PUBLIC_KEY",
    webhookUrl: process.env.MP_WEBHOOK_URL || "https://yourdomain.com/api/payments/mercadopago/webhook",
  },

  plans: [
    { id: "starter", credits: 100, price: 1.99, label: "Starter" },
    { id: "popular", credits: 500, price: 7.99, label: "Popular", badge: "BEST VALUE" },
    { id: "premium", credits: 1200, price: 14.99, label: "Premium" },
    { id: "ultimate", credits: 3000, price: 29.99, label: "Ultimate" },
  ],
};
