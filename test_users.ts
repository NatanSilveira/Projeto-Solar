import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const users = await db.execute("SELECT * FROM users ORDER BY rowid DESC LIMIT 10");
  console.log("Users:", users.rows);
}
main();
