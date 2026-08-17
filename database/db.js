const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const USE_PG = !!process.env.DATABASE_URL;
let pool = null;
let dbType = "sqlite";

// SQLite fallback
let sqlJsDb = null;
const fs = require("fs");
const path = require("path");
const DB_PATH = path.join(__dirname, "..", "misterybox.db");

async function initDB() {
  if (USE_PG) {
    dbType = "postgres";
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await createPostgresSchema();
    await seedPostgres();
    console.log("  Database: PostgreSQL connected");
  } else {
    dbType = "sqlite";
    const initSqlJs = require("sql.js");
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      sqlJsDb = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      sqlJsDb = new SQL.Database();
    }
    sqlJsDb.run("PRAGMA journal_mode = WAL");
    sqlJsDb.run("PRAGMA foreign_keys = ON");
    createSqliteSchema();
    seedSqlite();
    flushSqlite();
    console.log("  Database: SQLite (local)");
  }
}

// ═══════════════════════════════════════
// PostgreSQL schema + seed
// ═══════════════════════════════════════
async function createPostgresSchema() {
  const schemas = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      credits INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS box_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cost INTEGER NOT NULL,
      image TEXT,
      active INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS rarity_tiers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      probability DOUBLE PRECISION NOT NULL,
      box_type_id INTEGER REFERENCES box_types(id)
    )`,
    `CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      rarity_tier_id INTEGER REFERENCES rarity_tiers(id),
      box_type_id INTEGER REFERENCES box_types(id)
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      amount INTEGER,
      description TEXT,
      provider TEXT,
      provider_tx_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS open_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      box_type_id INTEGER NOT NULL REFERENCES box_types(id),
      item_id INTEGER NOT NULL REFERENCES items(id),
      credits_spent INTEGER NOT NULL,
      opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  for (const s of schemas) await pool.query(s);
}

async function seedPostgres() {
  const r = await pool.query("SELECT COUNT(*) as c FROM box_types");
  if (parseInt(r.rows[0].c) > 0) return;

  await pool.query("INSERT INTO box_types (name, description, cost, image) VALUES ($1,$2,$3,$4)", ["Common Box", "A simple box with basic items", 10, "box-common"]);
  await pool.query("INSERT INTO box_types (name, description, cost, image) VALUES ($1,$2,$3,$4)", ["Epic Box", "Contains powerful epic items", 50, "box-epic"]);
  await pool.query("INSERT INTO box_types (name, description, cost, image) VALUES ($1,$2,$3,$4)", ["Legendary Box", "The ultimate box with legendary loot", 150, "box-legendary"]);

  const boxes = await pool.query("SELECT id, name FROM box_types");
  const bMap = {};
  boxes.rows.forEach(b => { bMap[b.name] = b.id; });

  // Common Box tiers
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Common", "#9ca3af", 0.60, bMap["Common Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Rare", "#3b82f6", 0.30, bMap["Common Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Epic", "#a855f7", 0.09, bMap["Common Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Legendary", "#f59e0b", 0.01, bMap["Common Box"]]);

  const cbTiers = await pool.query("SELECT id, name FROM rarity_tiers WHERE box_type_id = $1", [bMap["Common Box"]]);
  const cbMap = {};
  cbTiers.rows.forEach(t => { cbMap[t.name] = t.id; });

  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Wooden Shield", "A basic wooden shield", "shield", cbMap["Common"], bMap["Common Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Iron Sword", "A sturdy iron sword", "sword", cbMap["Common"], bMap["Common Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Leather Boots", "Simple leather boots", "boots", cbMap["Common"], bMap["Common Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Magic Scroll", "A scroll with minor magic", "scroll", cbMap["Rare"], bMap["Common Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Silver Ring", "A gleaming silver ring", "ring", cbMap["Rare"], bMap["Common Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Enchanted Bow", "A bow imbued with magic", "bow", cbMap["Epic"], bMap["Common Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Phoenix Feather", "A rare mythical feather", "feather", cbMap["Legendary"], bMap["Common Box"]]);

  // Epic Box tiers
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Common", "#9ca3af", 0.50, bMap["Epic Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Rare", "#3b82f6", 0.35, bMap["Epic Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Epic", "#a855f7", 0.13, bMap["Epic Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Legendary", "#f59e0b", 0.02, bMap["Epic Box"]]);

  const ebTiers = await pool.query("SELECT id, name FROM rarity_tiers WHERE box_type_id = $1", [bMap["Epic Box"]]);
  const ebMap = {};
  ebTiers.rows.forEach(t => { ebMap[t.name] = t.id; });

  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Steel Armor", "Heavy steel armor", "armor", ebMap["Common"], bMap["Epic Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Mystic Cloak", "A cloak of mystery", "cloak", ebMap["Common"], bMap["Epic Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Crystal Staff", "A staff of pure crystal", "staff", ebMap["Rare"], bMap["Epic Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Shadow Blade", "A blade from the shadows", "blade", ebMap["Rare"], bMap["Epic Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Dragon Scale", "A scale from a dragon", "scale", ebMap["Epic"], bMap["Epic Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Void Amulet", "An amulet of the void", "amulet", ebMap["Epic"], bMap["Epic Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Celestial Crown", "A crown from the heavens", "crown", ebMap["Legendary"], bMap["Epic Box"]]);

  // Legendary Box tiers
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Rare", "#3b82f6", 0.55, bMap["Legendary Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Epic", "#a855f7", 0.35, bMap["Legendary Box"]]);
  await pool.query("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES ($1,$2,$3,$4)", ["Legendary", "#f59e0b", 0.10, bMap["Legendary Box"]]);

  const lbTiers = await pool.query("SELECT id, name FROM rarity_tiers WHERE box_type_id = $1", [bMap["Legendary Box"]]);
  const lbMap = {};
  lbTiers.rows.forEach(t => { lbMap[t.name] = t.id; });

  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Orcish Axe", "An axe of the orcs", "axe", lbMap["Rare"], bMap["Legendary Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Mithril Chain", "Chain made of mithril", "chain", lbMap["Rare"], bMap["Legendary Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Void Katana", "A katana of void energy", "katana", lbMap["Epic"], bMap["Legendary Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Dragonheart Gem", "A gem containing a dragon soul", "gem", lbMap["Epic"], bMap["Legendary Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["Excalibur", "The legendary sword", "excalibur", lbMap["Legendary"], bMap["Legendary Box"]]);
  await pool.query("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES ($1,$2,$3,$4,$5)", ["World Stone", "A stone that shapes reality", "stone", lbMap["Legendary"], bMap["Legendary Box"]]);

  const adminHash = bcrypt.hashSync("Genvicgar*9772", 10);
  await pool.query("INSERT INTO users (username, email, password, credits, role) VALUES ($1,$2,$3,$4,$5)", ["EBYZOM", "contacto@ebyzom.com", adminHash, 1000, "admin"]);
}

// ═══════════════════════════════════════
// SQLite schema + seed (local dev)
// ═══════════════════════════════════════
function createSqliteSchema() {
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, credits INTEGER DEFAULT 0, role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS box_types (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, cost INTEGER NOT NULL, image TEXT, active INTEGER DEFAULT 1)`);
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS rarity_tiers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT, probability REAL NOT NULL, box_type_id INTEGER, FOREIGN KEY (box_type_id) REFERENCES box_types(id))`);
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, image TEXT, rarity_tier_id INTEGER, box_type_id INTEGER, FOREIGN KEY (rarity_tier_id) REFERENCES rarity_tiers(id), FOREIGN KEY (box_type_id) REFERENCES box_types(id))`);
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, item_id INTEGER NOT NULL, obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (item_id) REFERENCES items(id))`);
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, amount INTEGER, description TEXT, provider TEXT, provider_tx_id TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
  sqlJsDb.run(`CREATE TABLE IF NOT EXISTS open_history (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, box_type_id INTEGER NOT NULL, item_id INTEGER NOT NULL, credits_spent INTEGER NOT NULL, opened_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (box_type_id) REFERENCES box_types(id), FOREIGN KEY (item_id) REFERENCES items(id))`);
}

function seedSqlite() {
  const boxCount = sqliteGet("SELECT COUNT(*) as c FROM box_types").c;
  if (boxCount > 0) return;

  sqlJsDb.run("INSERT INTO box_types (name, description, cost, image) VALUES (?, ?, ?, ?)", ["Common Box", "A simple box with basic items", 10, "box-common"]);
  sqlJsDb.run("INSERT INTO box_types (name, description, cost, image) VALUES (?, ?, ?, ?)", ["Epic Box", "Contains powerful epic items", 50, "box-epic"]);
  sqlJsDb.run("INSERT INTO box_types (name, description, cost, image) VALUES (?, ?, ?, ?)", ["Legendary Box", "The ultimate box with legendary loot", 150, "box-legendary"]);

  const boxRows = sqliteAll("SELECT id, name FROM box_types");
  const bMap = {};
  boxRows.forEach(b => { bMap[b.name] = b.id; });

  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Common", "#9ca3af", 0.60, bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Rare", "#3b82f6", 0.30, bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Epic", "#a855f7", 0.09, bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Legendary", "#f59e0b", 0.01, bMap["Common Box"]]);

  const cbTiers = sqliteAll("SELECT id, name FROM rarity_tiers WHERE box_type_id = ?", [bMap["Common Box"]]);
  const cbMap = {};
  cbTiers.forEach(t => { cbMap[t.name] = t.id; });

  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Wooden Shield", "A basic wooden shield", "shield", cbMap["Common"], bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Iron Sword", "A sturdy iron sword", "sword", cbMap["Common"], bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Leather Boots", "Simple leather boots", "boots", cbMap["Common"], bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Magic Scroll", "A scroll with minor magic", "scroll", cbMap["Rare"], bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Silver Ring", "A gleaming silver ring", "ring", cbMap["Rare"], bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Enchanted Bow", "A bow imbued with magic", "bow", cbMap["Epic"], bMap["Common Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Phoenix Feather", "A rare mythical feather", "feather", cbMap["Legendary"], bMap["Common Box"]]);

  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Common", "#9ca3af", 0.50, bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Rare", "#3b82f6", 0.35, bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Epic", "#a855f7", 0.13, bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Legendary", "#f59e0b", 0.02, bMap["Epic Box"]]);

  const ebTiers = sqliteAll("SELECT id, name FROM rarity_tiers WHERE box_type_id = ?", [bMap["Epic Box"]]);
  const ebMap = {};
  ebTiers.forEach(t => { ebMap[t.name] = t.id; });

  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Steel Armor", "Heavy steel armor", "armor", ebMap["Common"], bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Mystic Cloak", "A cloak of mystery", "cloak", ebMap["Common"], bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Crystal Staff", "A staff of pure crystal", "staff", ebMap["Rare"], bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Shadow Blade", "A blade from the shadows", "blade", ebMap["Rare"], bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Dragon Scale", "A scale from a dragon", "scale", ebMap["Epic"], bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Void Amulet", "An amulet of the void", "amulet", ebMap["Epic"], bMap["Epic Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Celestial Crown", "A crown from the heavens", "crown", ebMap["Legendary"], bMap["Epic Box"]]);

  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Rare", "#3b82f6", 0.55, bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Epic", "#a855f7", 0.35, bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO rarity_tiers (name, color, probability, box_type_id) VALUES (?, ?, ?, ?)", ["Legendary", "#f59e0b", 0.10, bMap["Legendary Box"]]);

  const lbTiers = sqliteAll("SELECT id, name FROM rarity_tiers WHERE box_type_id = ?", [bMap["Legendary Box"]]);
  const lbMap = {};
  lbTiers.forEach(t => { lbMap[t.name] = t.id; });

  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Orcish Axe", "An axe of the orcs", "axe", lbMap["Rare"], bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Mithril Chain", "Chain made of mithril", "chain", lbMap["Rare"], bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Void Katana", "A katana of void energy", "katana", lbMap["Epic"], bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Dragonheart Gem", "A gem containing a dragon soul", "gem", lbMap["Epic"], bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["Excalibur", "The legendary sword", "excalibur", lbMap["Legendary"], bMap["Legendary Box"]]);
  sqlJsDb.run("INSERT INTO items (name, description, image, rarity_tier_id, box_type_id) VALUES (?, ?, ?, ?, ?)", ["World Stone", "A stone that shapes reality", "stone", lbMap["Legendary"], bMap["Legendary Box"]]);

  const adminHash = bcrypt.hashSync("Genvicgar*9772", 10);
  sqlJsDb.run("INSERT INTO users (username, email, password, credits, role) VALUES (?, ?, ?, ?, ?)", ["EBYZOM", "contacto@ebyzom.com", adminHash, 1000, "admin"]);
}

// ═══════════════════════════════════════
// SQLite raw helpers (for seeding only)
// ═══════════════════════════════════════
function sqliteGet(sql, params = []) {
  const stmt = sqlJsDb.prepare(sql);
  if (params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function sqliteAll(sql, params = []) {
  const stmt = sqlJsDb.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function flushSqlite() {
  if (!sqlJsDb) return;
  const data = sqlJsDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ═══════════════════════════════════════
// PUBLIC API (auto-switches PG/SQLite)
// ═══════════════════════════════════════
function convertParams(sql, params) {
  let idx = 0;
  const converted = sql.replace(/\?/g, () => `$${++idx}`);
  return { text: converted, values: params };
}

async function get(sql, params = []) {
  if (dbType === "postgres") {
    const result = await pool.query(convertParams(sql, params));
    return result.rows[0] || null;
  }
  return sqliteGet(sql, params);
}

async function all(sql, params = []) {
  if (dbType === "postgres") {
    const result = await pool.query(convertParams(sql, params));
    return result.rows;
  }
  return sqliteAll(sql, params);
}

async function run(sql, params = []) {
  if (dbType === "postgres") {
    let pgSql = sql;
    if (/^\s*INSERT\s/i.test(sql) && !/RETURNING/i.test(sql)) {
      pgSql = sql + " RETURNING id";
    }
    const result = await pool.query(convertParams(pgSql, params));
    const lastId = result.rows[0] ? result.rows[0].id : 0;
    return { lastInsertRowid: lastId, changes: result.rowCount };
  }
  sqlJsDb.run(sql, params);
  const r = sqliteAll("SELECT last_insert_rowid() as id");
  const lastId = r.length > 0 ? r[0].id : 0;
  flushSqlite();
  return { lastInsertRowid: lastId, changes: 0 };
}

function flush() {
  if (dbType === "sqlite") flushSqlite();
}

module.exports = { initDB, get, all, run, flush };
