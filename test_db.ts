import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const r1 = await db.execute("SELECT * FROM users LIMIT 1");
  console.log("user:", r1.rows[0]);
  if (r1.rows.length) {
    try {
      await db.execute("INSERT INTO users (id, name, email, role) VALUES ('test_id_123', 'test', 'test@test.com', 'promoter')");
      await db.execute("DELETE FROM users WHERE id = 'test_id_123'");
      console.log("Delete test user ok");
    } catch(e) {
      console.error(e);
    }
  }
}
main().catch(console.error);
