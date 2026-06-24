// postgres.js, al usar prepare:false (obligatorio con el Transaction Pooler
// de Supabase), recurre al protocolo "simple query" de Postgres. En ese modo
// no aplica su conversión automática de columnas jsonb a objeto JS: las
// devuelve como el texto JSON crudo. Esta función normaliza ambos casos:
// si ya es un objeto/array (por si en el futuro cambia el comportamiento),
// lo deja igual; si es texto, lo parsea.
export function parseJsonb(value: unknown) {
  if (value == null) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
