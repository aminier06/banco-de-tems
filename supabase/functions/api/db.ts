// Capa de acceso a datos: PostgreSQL a través de "postgres" (postgres.js).
//
// IMPORTANTE: en Edge Functions usa el Transaction Pooler de Supabase
// (puerto 6543), no el Session Pooler (5432) que usaba el backend en
// Express. El Transaction Pooler está pensado para clientes de muy corta
// duración como esta función, y por eso es obligatorio desactivar los
// "prepared statements" (prepare: false): el pooler no los soporta.

import postgres from "npm:postgres@3.4.4";

const databaseUrl = Deno.env.get("DATABASE_URL");

if (!databaseUrl) {
  throw new Error(
    "Falta el secreto DATABASE_URL. Configúralo con: supabase secrets set DATABASE_URL=\"...\""
  );
}

export const sql = postgres(databaseUrl, {
  prepare: false,
  ssl: "require",
});
