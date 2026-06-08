import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function run() {
  await db.execute("UPDATE users SET role = 'supervisor' WHERE email = 'supervisor@solar.com'");
  console.log("Supervisor restored!");
}

run();
