import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function resetDB() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Missing TURSO env vars");
    return;
  }
  const db = createClient({ url, authToken });
  
  console.log("Resetting database tables...");
  
  const tables = [
    'users',
    'products',
    'stores',
    'expirations',
    'form_templates',
    'form_responses',
    'material_requests'
  ];
  
  for (const table of tables) {
    console.log(`Clearing ${table}...`);
    await db.execute(`DELETE FROM ${table}`);
  }
  
  console.log("Database reset complete.");
}

resetDB().catch(console.error);
