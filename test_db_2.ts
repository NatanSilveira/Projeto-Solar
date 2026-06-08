import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const supervisorId = "s1"; // Natan's ID or whoever it is? Let's assume some ID
  try {
    const q1 = await db.execute("SELECT u.* FROM users u WHERE role = 'supervisor' LIMIT 1");
    if(!q1.rows.length) return console.log("No supervisor");
    const sup = q1.rows[0].id;
    console.log("Found supervisor:", sup);
    
    // test team
    console.log("Team");
    const team = await db.execute({
      sql: "SELECT * FROM users WHERE role = 'promoter' AND supervisor_id = ?",
      args: [sup]
    });
    console.log(team.rows);
    
    // test stores
    console.log("Stores");
    const stores = await db.execute({
      sql: "SELECT * FROM stores WHERE supervisor_id = ?",
      args: [sup]
    });
    console.log(stores.rows);
    
    const reqs = await db.execute({
      sql: "SELECT r.* FROM material_requests r JOIN users u ON r.promoter_id = u.id WHERE u.supervisor_id = ?",
      args: [sup]
    });
    console.log("Requests", reqs.rows.length);

    const forms = await db.execute({
      sql: "SELECT r.* FROM form_responses r JOIN users u ON r.promoter_id = u.id WHERE u.supervisor_id = ?",
      args: [sup]
    });
    console.log("Forms", forms.rows.length);

  } catch(e) {
    console.error("SQL ERROR:", e);
  }
}
main().catch(console.error);
