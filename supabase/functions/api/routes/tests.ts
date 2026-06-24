import { Hono } from "jsr:@hono/hono@4";
import { Tests } from "../models/tests.ts";
import { Items } from "../models/items.ts";
import { requerirSesion, requerirTecnico, requerirAdmin } from "../auth.ts";
import { AREA_IDS } from "../constants.ts";

export const testsRoutes = new Hono();

testsRoutes.use("*", requerirSesion);

testsRoutes.get("/", async (c) => {
  return c.json({ tests: await Tests.list() });
});

testsRoutes.post("/", requerirTecnico, async (c) => {
  const user = c.get("user");
  const b = await c.req.json().catch(() => ({}));
  if (!AREA_IDS.includes(b.area)) return c.json({ error: "Área inválida." }, 400);
  if (!Array.isArray(b.itemIds) || b.itemIds.length === 0) return c.json({ error: "Selecciona al menos un ítem." }, 400);

  const items = await Items.findByIds(b.itemIds);
  if (items.length !== b.itemIds.length) return c.json({ error: "Alguno de los ítems seleccionados ya no existe." }, 400);
  if (items.some((i: any) => i.area !== b.area || i.estado !== "aprobado")) {
    return c.json({ error: "Solo se pueden usar ítems aprobados de la misma área." }, 400);
  }

  const test = await Tests.create(
    {
      nombre: b.nombre || `Prueba de ${b.area}`,
      area: b.area,
      grado: b.grado || "6to de Secundaria",
      convocatoria: b.convocatoria || "Primera convocatoria",
      totalItems: Number(b.totalItems) || b.itemIds.length,
      itemIds: b.itemIds,
    },
    user.id
  );
  return c.json({ test }, 201);
});

testsRoutes.delete("/:id", requerirAdmin, async (c) => {
  const id = c.req.param("id");
  const eliminado = await Tests.remove(id);
  if (!eliminado) return c.json({ error: "Prueba no encontrada." }, 404);
  return c.body(null, 204);
});
