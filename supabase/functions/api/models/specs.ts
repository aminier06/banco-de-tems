import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
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

  async upsert(area: string, { nombre, afirmaciones, tiposTexto }: any) {
    const data = JSON.stringify({ afirmaciones, tiposTexto: tiposTexto || [] });
    await sql`
      INSERT INTO specs (area, nombre, data) VALUES (${area}, ${nombre || area}, ${data}::jsonb)
      ON CONFLICT (area) DO UPDATE SET nombre = EXCLUDED.nombre, data = EXCLUDED.data
    `;
    return this.get(area);
  },
};
