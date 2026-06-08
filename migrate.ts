import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({ url: url!, authToken: authToken! });

async function migrate() {
  try {
    console.log("Adding store_name to expirations...");
    await db.execute("ALTER TABLE expirations ADD COLUMN store_name TEXT");
    console.log("Success!");
  } catch (e: any) {
    if (e.message.includes("duplicate column name")) {
        console.log("Column already exists.");
    } else {
        console.error("Error:", e);
    }
  }
}

migrate();
