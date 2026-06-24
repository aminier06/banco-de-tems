import { Hono } from "jsr:@hono/hono@4";
import { Items } from "../models/items.ts";
import { requerirSesion, requerirAdmin } from "../auth.ts";
import { AREA_IDS, DIFICULTADES, esTecnico } from "../constants.ts";

export const itemsRoutes = new Hono();

itemsRoutes.use("*", requerirSesion);

function puedeEditarItem(user: any, item: any) {
  return esTecnico(user.rol) || (item.autorId === user.id && (item.estado === "borrador" || item.estado === "rechazado"));
}

function puedeCrearEnArea(user: any, area: string) {
  return esTecnico(user.rol) || user.area === area;
}

itemsRoutes.get("/", async (c) => {
  const area = c.req.query("area");
  const estado = c.req.query("estado");
  const items = await Items.list({ area, estado });
  return c.json({ items });
});

itemsRoutes.post("/", async (c) => {
  const user = c.get("user");
  const b = await c.req.json().catch(() => ({}));
  if (!AREA_IDS.includes(b.area)) return c.json({ error: "Área inválida." }, 400);
  if (!puedeCrearEnArea(user, b.area)) return c.json({ error: "No tienes permiso para crear ítems en esa área." }, 403);
  if (!b.enunciado?.trim()) return c.json({ error: "Falta el enunciado." }, 400);
  if (!Array.isArray(b.opciones) || b.opciones.length !== 4 || b.opciones.some((o: string) => !o?.trim())) {
    return c.json({ error: "Se requieren las 4 opciones de respuesta." }, 400);
  }
  if (![0, 1, 2, 3].includes(b.respuestaCorrecta)) return c.json({ error: "Respuesta correcta inválida." }, 400);
  if (!DIFICULTADES.includes(b.dificultad)) return c.json({ error: "Dificultad inválida." }, 400);

  const item = await Items.create(
    {
      area: b.area,
      afirmacionId: b.afirmacionId,
      evidenciaId: b.evidenciaId,
      tipoTexto: b.tipoTexto,
      dificultad: b.dificultad,
      contexto: b.contexto,
      enunciado: b.enunciado.trim(),
      opciones: b.opciones,
      respuestaCorrecta: b.respuestaCorrecta,
      justificacionCorrecta: b.justificacionCorrecta,
      justificacionDistractores: b.justificacionDistractores,
      estado: "borrador",
      historial: [{ fecha: new Date().toISOString().slice(0, 10), autor: user.nombre, accion: "Creación del ítem." }],
    },
    user.id
  );
  return c.json({ item }, 201);
});

itemsRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const existente = await Items.findById(id);
  if (!existente) return c.json({ error: "Ítem no encontrado." }, 404);
  if (!puedeEditarItem(user, existente)) return c.json({ error: "No tienes permiso para editar este ítem." }, 403);

  const body = await c.req.json().catch(() => ({}));
  const item = await Items.update(id, body);
  return c.json({ item });
});

itemsRoutes.post("/:id/submit", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const item = await Items.findById(id);
  if (!item) return c.json({ error: "Ítem no encontrado." }, 404);
  if (item.autorId !== user.id || !["borrador", "rechazado"].includes(item.estado)) {
    return c.json({ error: "No puedes enviar este ítem a revisión." }, 403);
  }
  if (!item.afirmacionId || !item.evidenciaId) {
    return c.json({ error: "Asigna afirmación y evidencia antes de enviar a revisión." }, 400);
  }
  const historial = [
    ...item.historial,
    { fecha: new Date().toISOString().slice(0, 10), autor: user.nombre, accion: "Enviado a revisión." },
  ];
  return c.json({ item: await Items.setEstado(item.id, "en_revision", historial) });
});

itemsRoutes.post("/:id/review", async (c) => {
  const user = c.get("user");
  if (!esTecnico(user.rol)) return c.json({ error: "Requiere rol de equipo técnico o administrador." }, 403);
  const id = c.req.param("id");
  const item = await Items.findById(id);
  if (!item) return c.json({ error: "Ítem no encontrado." }, 404);
  if (item.estado !== "en_revision") return c.json({ error: "Este ítem no está en revisión." }, 400);

  const body = await c.req.json().catch(() => ({}));
  const { aprobar, comentario } = body;
  if (!aprobar && !comentario?.trim()) {
    return c.json({ error: "El comentario es obligatorio al rechazar un ítem." }, 400);
  }
  const historial = [
    ...item.historial,
    {
      fecha: new Date().toISOString().slice(0, 10),
      autor: user.nombre,
      accion: aprobar ? "Aprobado." : "Rechazado.",
      comentario: comentario || undefined,
    },
  ];
  return c.json({ item: await Items.setEstado(item.id, aprobar ? "aprobado" : "rechazado", historial) });
});

itemsRoutes.delete("/:id", requerirAdmin, async (c) => {
  const id = c.req.param("id");
  const eliminado = await Items.remove(id);
  if (!eliminado) return c.json({ error: "Ítem no encontrado." }, 404);
  return c.body(null, 204);
});

// Importación masiva (migración desde el banco anterior). El frontend ya
// parseó el Excel/CSV y resolvió área/afirmación/evidencia; aquí se vuelve a
// validar lo mínimo indispensable antes de insertar, y todo entra como
// "borrador" para pasar de nuevo por revisión.
itemsRoutes.post("/import", requerirAdmin, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const filas = Array.isArray(body?.items) ? body.items : [];
  if (filas.length === 0) return c.json({ error: "No se recibieron filas para importar." }, 400);

  const nombreArchivo = body?.nombreArchivo || "archivo externo";
  const validas = filas
    .filter(
      (f: any) =>
        AREA_IDS.includes(f.area) &&
        f.enunciado?.trim() &&
        Array.isArray(f.opciones) &&
        f.opciones.length === 4 &&
        f.opciones.every((o: string) => o?.trim()) &&
        [0, 1, 2, 3].includes(f.respuestaCorrecta)
    )
    .map((f: any) => ({
      ...f,
      dificultad: DIFICULTADES.includes(f.dificultad) ? f.dificultad : "Media",
      justificacionCorrecta: f.justificacionCorrecta || "(Pendiente: agregar justificación durante la revisión).",
      historial: [{ fecha: new Date().toISOString().slice(0, 10), autor: user.nombre, accion: `Migrado desde "${nombreArchivo}".` }],
    }));

  const creados = await Items.bulkImport(validas, user.id);
  return c.json({ importados: creados, descartados: filas.length - validas.length }, 201);
});
