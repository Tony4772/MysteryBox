/**
 * payment_config.js
 * ─────────────────────────────────────────────────
 * Configuración de la pasarela de pagos (Culqi).
 * Las llaves se leen desde el archivo .env:
 *   CULQI_PUBLIC_KEY=pk_test_...
 *   CULQI_SECRET_KEY=sk_test_...
 * Los precios de los planes están en soles (PEN).
 * ─────────────────────────────────────────────────
 */

const publicKey = (process.env.CULQI_PUBLIC_KEY || "").trim();
const secretKey = (process.env.CULQI_SECRET_KEY || "").trim();

function isConfigured() {
  return Boolean(publicKey && secretKey);
}

module.exports = {
  culqi: {
    publicKey,
    secretKey,
    apiBase: "https://api.culqi.com/v2",
    currency: "PEN",
    isConfigured,
  },

  plans: [
    { id: "starter", credits: 100, price: 7.9, label: "Starter" },
    { id: "popular", credits: 500, price: 29.9, label: "Popular", badge: "MEJOR VALOR" },
    { id: "premium", credits: 1200, price: 55.9, label: "Premium" },
    { id: "ultimate", credits: 3000, price: 109.9, label: "Ultimate" },
  ],
};
