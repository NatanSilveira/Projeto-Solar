import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  // 1. Coloque o email do usuário que você quer deletar aqui:
  const emailParaApagar = 'colocar_email_aqui@solar.com';
  
  try {
    const res = await db.execute({
      sql: "DELETE FROM users WHERE email = ?",
      args: [emailParaApagar]
    });
    
    if (res.rowsAffected > 0) {
      console.log(`✅ Usuário com email ${emailParaApagar} foi apagado com sucesso!`);
    } else {
      console.log(`⚠️ Nenhum usuário encontrado com o email ${emailParaApagar}.`);
    }
  } catch (error) {
    console.error("Erro ao apagar usuário:", error);
  }
}

main();
