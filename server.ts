import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient, Client } from "@libsql/client";
import path from "path";

// Lazy initialization of the Turso client
let tursoClient: Client | null = null;

function getTursoClient(): Client {
  if (!tursoClient) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required.");
    }

    tursoClient = createClient({
      url,
      authToken,
    });
  }
  return tursoClient;
}

async function ensureTables(db: Client) {
  console.log("Checking database schema...");
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      supervisor_id TEXT,
      store_id TEXT,
      avatar TEXT
    )
  `);

  try { await db.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e) {}
  try { await db.execute("ALTER TABLE users ADD COLUMN password TEXT"); } catch (e) {}
  try { await db.execute("ALTER TABLE users ADD COLUMN store_id TEXT"); } catch (e) {}

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
      questions TEXT NOT NULL,
      target_promoter_ids TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  try { await db.execute("ALTER TABLE form_templates ADD COLUMN target_promoter_ids TEXT"); } catch (e) {}

  await db.execute(`
    CREATE TABLE IF NOT EXISTS form_responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      promoter_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      answers TEXT NOT NULL,
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
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      supervisor_id TEXT
    )
  `);

  try { await db.execute("ALTER TABLE stores ADD COLUMN supervisor_id TEXT"); } catch (e) {}

  console.log("Database schema is up to date.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and ensure tables exist
  try {
    const db = getTursoClient();
    await ensureTables(db);
  } catch (err) {
    console.error("Failed to initialize database tables on startup:", err);
  }

  app.use(express.json());

  // --- API Routes ---
  
  // Health check & Turso connection test
  app.get("/api/health", async (req, res) => {
    try {
      if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return res.json({ 
          status: "warning", 
          message: "Server is running, but Turso credentials are missing in Secrets." 
        });
      }
      const db = getTursoClient();
      await db.execute("SELECT 1");
      res.json({ status: "ok", message: "Server is running and connected to Turso Database!" });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({ status: "error", message: "Failed to connect to Turso Database.", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { email: rawEmail, role, password } = req.body;
      const email = rawEmail.toLowerCase();
      const db = getTursoClient();
      
      let result = await db.execute({
        sql: "SELECT * FROM users WHERE LOWER(email) = ?",
        args: [email]
      });

      if (result.rows.length > 0) {
        const user = result.rows[0];
        
        // Simple password check (should be hashed in real apps)
        if (user.password && user.password !== password) {
          return res.status(401).json({ error: "Senha incorreta" });
        }

        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          supervisorId: user.supervisor_id,
          storeId: user.store_id,
          avatar: user.avatar
        });
      } else {
        // Auto-create user for testing if it's a new login attempt with SOLAR email
        if (!email.endsWith('@solar.com')) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const id = Math.random().toString(36).substr(2, 9);
        const name = email.split('@')[0];
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
        
        await db.execute({
          sql: "INSERT INTO users (id, name, email, role, avatar, password) VALUES (?, ?, ?, ?, ?, ?)",
          args: [id, name, email, role, avatar, password || null]
        });
        
        res.json({
          id,
          name,
          email,
          role: role,
          supervisorId: null,
          avatar
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Products
  app.get("/api/products", async (req, res) => {
    try {
      const db = getTursoClient();
      const result = await db.execute("SELECT * FROM products");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add Product
  app.post("/api/products", async (req, res) => {
    try {
      const { id, name, barcode, category } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "INSERT INTO products (id, name, barcode, category) VALUES (?, ?, ?, ?)",
        args: [id, name, barcode, category || 'Outros']
      });
      
      res.status(201).json({ success: true, product: { id, name, barcode, category: category || 'Outros' } });
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Expirations
  app.get("/api/expirations", async (req, res) => {
    try {
      const { supervisorId, promoterId } = req.query;
      const db = getTursoClient();
      
      let sql = `
        SELECT e.*, p.name as product_name 
        FROM expirations e
        JOIN products p ON e.product_id = p.id
      `;
      const args: any[] = [];

      if (supervisorId) {
        sql += " JOIN users u ON e.promoter_id = u.id WHERE u.supervisor_id = ?";
        args.push(supervisorId);
      } else if (promoterId) {
        sql += " WHERE e.promoter_id = ?";
        args.push(promoterId);
      }
      
      sql += " ORDER BY e.recorded_at DESC";
      
      const result = await db.execute({ sql, args });
      
      const expirations = result.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        storeId: row.store_id,
        storeName: row.store_name || 'Loja Desconhecida',
        promoterId: row.promoter_id,
        expirationDate: row.expiration_date,
        quantity: row.quantity,
        dailyGiro: row.daily_giro,
        riskLevel: row.risk_level,
        recordedAt: row.recorded_at
      }));
      
      res.json(expirations);
    } catch (error) {
      console.error("Error fetching expirations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add Expiration
  app.post("/api/expirations", async (req, res) => {
    try {
      const { id, productId, storeId, storeName, promoterId, expirationDate, quantity, dailyGiro, riskLevel, recordedAt } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: `INSERT INTO expirations 
              (id, product_id, store_id, store_name, promoter_id, expiration_date, quantity, daily_giro, risk_level, recorded_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, productId, storeId, storeName, promoterId, expirationDate, quantity, dailyGiro, riskLevel, recordedAt]
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error adding expiration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Form Endpoints ---

  // Get Form Templates
  app.get("/api/forms", async (req, res) => {
    try {
      const { supervisorId, promoterId } = req.query;
      const db = getTursoClient();
      
      let sql = "SELECT f.* FROM form_templates f";
      const args: any[] = [];
      
      if (supervisorId) {
        sql += " WHERE f.supervisor_id = ?";
        args.push(supervisorId);
      } else if (promoterId) {
        sql += ` JOIN users u ON u.id = ? 
                 WHERE (f.supervisor_id = u.supervisor_id OR f.supervisor_id IS NULL)
                   AND (f.target_promoter_ids IS NULL OR f.target_promoter_ids LIKE '%' || ? || '%')`;
        args.push(promoterId, promoterId);
      }
      
      sql += " ORDER BY f.created_at DESC";

      const result = await db.execute({ sql, args });
      
      const forms = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        questions: JSON.parse(row.questions as string),
        targetPromoterIds: row.target_promoter_ids ? JSON.parse(row.target_promoter_ids as string) : null,
        createdAt: row.created_at,
        lastUpdated: row.updated_at,
        supervisorId: row.supervisor_id
      }));
      
      res.json(forms);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete Form Template
  app.delete("/api/forms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      
      // Clean up linked responses due to foreign key
      await db.execute({ sql: "DELETE FROM form_responses WHERE form_id = ?", args: [id] });

      await db.execute({ sql: "DELETE FROM form_templates WHERE id = ?", args: [id] });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting form:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create Form Template
  app.post("/api/forms", async (req, res) => {
    try {
      const { id, title, description, status, questions, targetPromoterIds, createdAt, lastUpdated, supervisorId } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "INSERT INTO form_templates (id, title, description, status, questions, target_promoter_ids, created_at, updated_at, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, title, description, status, JSON.stringify(questions), targetPromoterIds ? JSON.stringify(targetPromoterIds) : null, createdAt, lastUpdated, supervisorId || null]
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error creating form:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Form Responses
  app.get("/api/form-responses", async (req, res) => {
    try {
      const { formId, supervisorId, promoterId } = req.query;
      const db = getTursoClient();
      
      let sql = "SELECT r.* FROM form_responses r";
      const args: any[] = [];
      const conditions: string[] = [];
      
      if (supervisorId) {
        sql += " JOIN users u ON r.promoter_id = u.id";
        conditions.push("u.supervisor_id = ?");
        args.push(supervisorId);
      } else if (promoterId) {
        conditions.push("r.promoter_id = ?");
        args.push(promoterId);
      }
      
      if (formId) {
        conditions.push("r.form_id = ?");
        args.push(formId);
      }
      
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      
      sql += " ORDER BY r.submitted_at DESC";
      
      const result = await db.execute({ sql, args });
      
      const responses = result.rows.map(row => ({
        id: row.id,
        formId: row.form_id,
        promoterId: row.promoter_id,
        storeId: row.store_id,
        storeName: row.store_name,
        answers: JSON.parse(row.answers as string),
        submittedAt: row.submitted_at
      }));
      
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Submit Form Response
  app.post("/api/form-responses", async (req, res) => {
    try {
      const { id, formId, promoterId, storeId, storeName, answers, submittedAt } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "INSERT INTO form_responses (id, form_id, promoter_id, store_id, store_name, answers, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [id, formId, promoterId, storeId, storeName, JSON.stringify(answers), submittedAt]
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error submitting response:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Team Endpoints ---

  app.get("/api/team", async (req, res) => {
    try {
      const { supervisorId, promoterId } = req.query;
      const db = getTursoClient();
      
      let sql = "SELECT id, name, email, role, status, avatar, supervisor_id, store_id FROM users WHERE role = 'promoter'";
      const args: any[] = [];
      
      if (supervisorId) {
        sql += " AND supervisor_id = ?";
        args.push(supervisorId);
      } else if (promoterId) {
        sql += " AND id = ?";
        args.push(promoterId);
      } else {
        return res.json([]);
      }
      
      const result = await db.execute({ sql, args });
      
      const team = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        avatar: row.avatar,
        supervisorId: row.supervisor_id,
        storeId: row.store_id
      }));
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Stores Endpoints ---
  app.get("/api/stores", async (req, res) => {
    try {
      const { supervisorId, promoterId } = req.query;
      const db = getTursoClient();
      
      let sql = "SELECT s.* FROM stores s";
      const args: any[] = [];
      
      if (supervisorId) {
        sql += " WHERE s.supervisor_id = ?";
        args.push(supervisorId);
      } else if (promoterId) {
        sql += " JOIN users u ON (s.supervisor_id = u.supervisor_id OR s.id = u.store_id) WHERE u.id = ?";
        args.push(promoterId);
      }
      
      const result = await db.execute({ sql, args });
      
      const stores = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        address: row.address,
        supervisorId: row.supervisor_id
      }));
      
      res.json(stores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/stores", async (req, res) => {
    try {
      const { id, name, address, supervisorId } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "INSERT INTO stores (id, name, address, supervisor_id) VALUES (?, ?, ?, ?)",
        args: [id, name, address, supervisorId || null]
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error adding store:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/stores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      
      // Clean up linked data so it doesn't break relationships or trigger constraints
      await db.execute({ sql: "DELETE FROM expirations WHERE store_id = ?", args: [id] });
      await db.execute({ sql: "DELETE FROM form_responses WHERE store_id = ?", args: [id] });
      // Since material_requests uses store_name traditionally we might not have a store_id there, so we leave it.

      await db.execute({
        sql: "DELETE FROM stores WHERE id = ?",
        args: [id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      
      // Clean up linked data
      await db.execute({ sql: "DELETE FROM expirations WHERE promoter_id = ?", args: [id] });
      await db.execute({ sql: "DELETE FROM form_responses WHERE promoter_id = ?", args: [id] });
      await db.execute({ sql: "DELETE FROM material_requests WHERE promoter_id = ?", args: [id] });

      await db.execute({
        sql: "DELETE FROM users WHERE id = ?",
        args: [id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "UPDATE users SET status = ? WHERE id = ?",
        args: [status, id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Material Requests Endpoints ---

  app.get("/api/requests", async (req, res) => {
    try {
      const { supervisorId, promoterId } = req.query;
      const db = getTursoClient();
      
      let sql = "SELECT r.* FROM material_requests r";
      const args: any[] = [];
      
      if (supervisorId) {
        sql += " JOIN users u ON r.promoter_id = u.id WHERE u.supervisor_id = ?";
        args.push(supervisorId);
      } else if (promoterId) {
        sql += " WHERE r.promoter_id = ?";
        args.push(promoterId);
      }
      
      sql += " ORDER BY r.created_at DESC";
      
      const result = await db.execute({ sql, args });
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const db = getTursoClient();
      const { id, type, store_name, description, promoter_id, created_at, status } = req.body;
      
      await db.execute({
        sql: "INSERT INTO material_requests (id, type, store_name, description, promoter_id, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [id, type, store_name, description, promoter_id, created_at, status || 'pending']
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update Request Status
  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "UPDATE material_requests SET status = ? WHERE id = ?",
        args: [status, id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update Expiration
  app.patch("/api/expirations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { expirationDate, quantity, dailyGiro, riskLevel } = req.body;
      const db = getTursoClient();
      
      await db.execute({
        sql: "UPDATE expirations SET expiration_date = ?, quantity = ?, daily_giro = ?, risk_level = ? WHERE id = ?",
        args: [expirationDate, quantity, dailyGiro, riskLevel, id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating expiration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete Expiration
  app.delete("/api/expirations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      
      await db.execute({
        sql: "DELETE FROM expirations WHERE id = ?",
        args: [id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting expiration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Register
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, role, supervisorId, password, storeId } = req.body;
      const lowerEmail = email.toLowerCase();
      const db = getTursoClient();
      
      const id = Math.random().toString(36).substr(2, 9);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
      
      await db.execute({
        sql: "INSERT INTO users (id, name, email, role, status, supervisor_id, avatar, password, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, name, lowerEmail, role, 'active', supervisorId || null, avatar, password, storeId || null]
      });
      
      res.status(201).json({
        id,
        name,
        email: lowerEmail,
        role,
        status: 'active',
        supervisorId: supervisorId || null,
        storeId: storeId || null,
        avatar
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
