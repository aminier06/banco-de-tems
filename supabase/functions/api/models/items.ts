import { sql } from "../db.ts";
import { parseJsonb } from "../jsonb.ts";

function mapRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    area: row.area,
    afirmacionId: row.afirmacion_id,
    evidenciaId: row.evidencia_id,
    tareaId: row.tarea_id,
    tipoTexto: row.tipo_texto,
    dificultad: row.dificultad,
    contexto: row.contexto,
    enunciado: row.enunciado,
    opciones: parseJsonb(row.opciones),
    respuestaCorrecta: row.respuesta_correcta,
    justificacionCorrecta: row.justificacion_correcta,
    justificacionDistractores: row.justificacion_distractores,
    estado: row.estado,
    historial: parseJsonb(row.historial),
    autorId: row.autor_id,
    autorNombre: row.autor_nombre || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const Items = {
  async list({ area, estado }: { area?: string; estado?: string } = {}) {
    let rows;
    if (area && estado) {
      rows = await sql`
        SELECT items.*, users.nombre AS autor_nombre FROM items LEFT JOIN users ON users.id = items.autor_id
        WHERE items.area = ${area} AND items.estado = ${estado} ORDER BY items.created_at DESC
      `;
    } else if (area) {
      rows = await sql`
        SELECT items.*, users.nombre AS autor_nombre FROM items LEFT JOIN users ON users.id = items.autor_id
        WHERE items.area = ${area} ORDER BY items.created_at DESC
      `;
    } else if (estado) {
      rows = await sql`
        SELECT items.*, users.nombre AS autor_nombre FROM items LEFT JOIN users ON users.id = items.autor_id
        WHERE items.estado = ${estado} ORDER BY items.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT items.*, users.nombre AS autor_nombre FROM items LEFT JOIN users ON users.id = items.autor_id
        ORDER BY items.created_at DESC
      `;
    }
    return rows.map(mapRow);
  },

  async findById(id: string) {
    const rows = await sql`
      SELECT items.*, users.nombre AS autor_nombre FROM items LEFT JOIN users ON users.id = items.autor_id
      WHERE items.id = ${id}
    `;
    return mapRow(rows[0]);
  },

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await sql`
      SELECT items.*, users.nombre AS autor_nombre FROM items LEFT JOIN users ON users.id = items.autor_id
      WHERE items.id = ANY(${sql.array(ids)})
    `;
    return rows.map(mapRow);
  },

  async create(b: any, autorId: string) {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO items
        (id, area, afirmacion_id, evidencia_id, tarea_id, tipo_texto, dificultad, contexto, enunciado, opciones,
         respuesta_correcta, justificacion_correcta, justificacion_distractores, estado, historial, autor_id)
      VALUES (
        ${id}, ${b.area}, ${b.afirmacionId || null}, ${b.evidenciaId || null}, ${b.tareaId || null}, ${b.tipoTexto || null},
        ${b.dificultad}, ${b.contexto || null}, ${b.enunciado}, ${JSON.stringify(b.opciones)}::jsonb,
        ${b.respuestaCorrecta}, ${b.justificacionCorrecta || null}, ${b.justificacionDistractores || null},
        ${b.estado || "borrador"}, ${JSON.stringify(b.historial || [])}::jsonb, ${autorId}
      )
    `;
    return this.findById(id);
  },

  async update(id: string, b: any) {
    const actual = await this.findById(id);
    if (!actual) return null;
    await sql`
      UPDATE items SET
        afirmacion_id = ${b.afirmacionId ?? actual.afirmacionId},
        evidencia_id = ${b.evidenciaId ?? actual.evidenciaId},
        tarea_id = ${b.tareaId ?? actual.tareaId},
        tipo_texto = ${b.tipoTexto ?? actual.tipoTexto},
        dificultad = ${b.dificultad ?? actual.dificultad},
        contexto = ${b.contexto ?? actual.contexto},
        enunciado = ${b.enunciado ?? actual.enunciado},
        opciones = ${JSON.stringify(b.opciones ?? actual.opciones)}::jsonb,
        respuesta_correcta = ${b.respuestaCorrecta ?? actual.respuestaCorrecta},
        justificacion_correcta = ${b.justificacionCorrecta ?? actual.justificacionCorrecta},
        justificacion_distractores = ${b.justificacionDistractores ?? actual.justificacionDistractores},
        updated_at = now()
      WHERE id = ${id}
    `;
    return this.findById(id);
  },

  async setEstado(id: string, estado: string, historial: any[]) {
    await sql`
      UPDATE items SET estado = ${estado}, historial = ${JSON.stringify(historial)}::jsonb, updated_at = now()
      WHERE id = ${id}
    `;
    return this.findById(id);
  },

  async remove(id: string) {
    const result = await sql`DELETE FROM items WHERE id = ${id}`;
    return result.count > 0;
  },

  async bulkImport(filas: any[], fallbackAutorId: string) {
    return await sql.begin(async (tx: any) => {
      let creados = 0;
      for (const f of filas) {
        const id = crypto.randomUUID();
        await tx`
          INSERT INTO items
            (id, area, afirmacion_id, evidencia_id, tarea_id, tipo_texto, dificultad, contexto, enunciado, opciones,
             respuesta_correcta, justificacion_correcta, justificacion_distractores, estado, historial, autor_id)
          VALUES (
            ${id}, ${f.area}, ${f.afirmacionId || null}, ${f.evidenciaId || null}, ${f.tareaId || null}, ${f.tipoTexto || null},
            ${f.dificultad}, ${f.contexto || null}, ${f.enunciado}, ${JSON.stringify(f.opciones)}::jsonb,
            ${f.respuestaCorrecta}, ${f.justificacionCorrecta || null}, ${f.justificacionDistractores || null},
            'borrador', ${JSON.stringify(f.historial || [])}::jsonb, ${f.autorId || fallbackAutorId}
          )
        `;
        creados++;
      }
      return creados;
    });
  },
};
