import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    area: row.area,
    grado: row.grado,
    convocatoria: row.convocatoria,
    totalItems: row.total_items,
    itemIds: parseJsonb(row.item_ids),
    creadoPorId: row.creado_por_id,
    createdAt: row.created_at,
  };
}

export const Tests = {
  async list() {
    const rows = await sql`SELECT * FROM tests ORDER BY created_at DESC`;
    return rows.map(mapRow);
  },

  async create(b: any, creadoPorId: string) {
    const id = crypto.randomUUID();
    const rows = await sql`
      INSERT INTO tests (id, nombre, area, grado, convocatoria, total_items, item_ids, creado_por_id)
      VALUES (${id}, ${b.nombre}, ${b.area}, ${b.grado}, ${b.convocatoria}, ${b.totalItems}, ${JSON.stringify(b.itemIds)}::jsonb, ${creadoPorId})
      RETURNING *
    `;
    return mapRow(rows[0]);
  },

  async remove(id: string) {
    const result = await sql`DELETE FROM tests WHERE id = ${id}`;
    return result.count > 0;
  },
};
