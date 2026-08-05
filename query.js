import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();
const db = createClient({url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN});
async function run() {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await db.execute('PRAGMA table_info(form_templates)');
      console.log(res.rows);
      return;
    } catch (e) {
      console.error(e.message);
    }
  }
}
run();
