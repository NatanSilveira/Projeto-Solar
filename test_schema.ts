import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const tableQuery = await db.execute("SELECT name, sql FROM sqlite_schema WHERE type='table';");
  console.log(tableQuery.rows);
}
main();
