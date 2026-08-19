import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    const res = await db.execute("SELECT id, name, email, role FROM users;");
    console.log("USERS IN DB:", res.rows);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
