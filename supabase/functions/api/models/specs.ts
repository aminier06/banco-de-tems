import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
  // row.data ya llega como objeto JS (parseJsonb normaliza si llega como texto).
  // Forma actual: { competencias: [ { id, nombre, afirmaciones, tiposTexto }, ... ] }
  return { area: row.area, nombre: row.nombre, ...parseJsonb(row.data) };
}

export const Specs = {
  async all() {
    const rows = await sql`SELECT * FROM specs`;
    const porArea: Record<string, any> = {};
    rows.forEach((f: any) => {
      porArea[f.area] = mapRow(f);
    });
    return porArea;
  },

  async get(area: string) {
    const rows = await sql`SELECT * FROM specs WHERE area = ${area}`;
    return mapRow(rows[0]);
  },

  // body: { competencias: [{ id, nombre, afirmaciones, tiposTexto }, ...] }
  // Se guarda tal cual como jsonb; la validación de pesos vive en la ruta.
  async upsert(area: string, body: any) {
    const competencias = Array.isArray(body?.competencias) ? body.competencias : [];
    const data = JSON.stringify({ competencias });
    await sql`
      INSERT INTO specs (area, nombre, data) VALUES (${area}, ${area}, ${data}::jsonb)
      ON CONFLICT (area) DO UPDATE SET data = EXCLUDED.data
    `;
    return this.get(area);
  },
};
