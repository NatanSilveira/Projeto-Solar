import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing Turso credentials.");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function check() {
  try {
    const result = await db.execute("SELECT * FROM users");
    console.log("Users:", result.rows);
  } catch (e) {
    console.error("Error:", e);
  }
}

check();
