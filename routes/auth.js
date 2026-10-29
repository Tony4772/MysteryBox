const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { get, run } = require("../database/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-this-to-a-strong-secret-key-in-production";

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    const existing = await get("SELECT id FROM users WHERE email = ? OR username = ?", [email, username]);
    if (existing) {
      return res.status(409).json({ error: "Usuario o email ya registrado" });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = await run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hash]);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: result.lastInsertRowid, username, email, role: "user", credits: 0 } });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor: " + err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, credits: user.credits },
    });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor: " + err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await get("SELECT id, username, email, credits, role, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
