import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const users = await db.execute("SELECT * FROM users WHERE email = 'natan.10.dez@gmail.com'");
  console.log("Users:", users.rows);
}
main();
