import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  try {
    const s1 = await db.execute("SELECT * FROM form_responses ORDER BY submitted_at DESC LIMIT 1");
    console.log("form_responses:", s1.rows[0]);

    const s2 = await db.execute("SELECT * FROM expirations ORDER BY recorded_at DESC LIMIT 1");
    console.log("expirations:", s2.rows[0]);

    const s3 = await db.execute("SELECT * FROM material_requests ORDER BY created_at DESC LIMIT 1");
    console.log("material_requests:", s3.rows[0]);
  } catch(e) {
    console.error(e);
  }
}
main().catch(console.error);
