import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing Turso credentials. Make sure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set.");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function init() {
  try {
    console.log("Creating tables...");
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        supervisor_id TEXT,
        avatar TEXT
      )
    `);

    // Ensure status column exists in users
    try {
      await db.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
    } catch (e) {}

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT UNIQUE NOT NULL,
        category TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS expirations (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        store_name TEXT,
        promoter_id TEXT NOT NULL,
        expiration_date TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        daily_giro REAL NOT NULL,
        risk_level TEXT NOT NULL,
        recorded_at TEXT NOT NULL
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        questions TEXT NOT NULL, -- JSON string
        target_promoter_ids TEXT, -- JSON array string, NULL means ALL
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Ensure target_promoter_ids column exists in form_templates
    try {
      await db.execute("ALTER TABLE form_templates ADD COLUMN target_promoter_ids TEXT");
    } catch (e) {}

    await db.execute(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        promoter_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        store_name TEXT NOT NULL,
        answers TEXT NOT NULL, -- JSON string
        submitted_at TEXT NOT NULL,
        FOREIGN KEY (form_id) REFERENCES form_templates (id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS material_requests (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        store_name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        description TEXT,
        promoter_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    console.log("Tables created successfully.");

    // Seed Data
    const usersCount = await db.execute("SELECT COUNT(*) as count FROM users");
    if (Number(usersCount.rows[0].count) === 0) {
      console.log("Seeding users...");
      await db.execute({
        sql: "INSERT INTO users (id, name, email, role, supervisor_id, avatar) VALUES (?, ?, ?, ?, ?, ?)",
        args: ['p1', 'João Promotor', 'promotor@solar.com', 'promoter', 's1', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao']
      });
      await db.execute({
        sql: "INSERT INTO users (id, name, email, role, supervisor_id, avatar) VALUES (?, ?, ?, ?, ?, ?)",
        args: ['s1', 'Carlos Supervisor', 'supervisor@solar.com', 'supervisor', null, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos']
      });
    }

    const productsCount = await db.execute("SELECT COUNT(*) as count FROM products");
    if (Number(productsCount.rows[0].count) === 0) {
      console.log("Seeding products...");
      const products = [
        ['prod1', 'Coca-Cola Original 2L', '7894900011517', 'Refrigerantes'],
        ['prod2', 'Coca-Cola Zero 350ml', '7894900011524', 'Refrigerantes'],
        ['prod3', 'Kuat Guaraná 2L', '7894900011531', 'Refrigerantes'],
        ['prod4', 'Monster Energy 473ml', '7894900011548', 'Energéticos']
      ];
      for (const p of products) {
        await db.execute({
          sql: "INSERT INTO products (id, name, barcode, category) VALUES (?, ?, ?, ?)",
          args: p
        });
      }
    }

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

init();
