import { Hono } from "jsr:@hono/hono@4";
import { Specs } from "../models/specs.ts";
import { requerirSesion, requerirTecnico } from "../auth.ts";
import { AREA_IDS } from "../constants.ts";

export const specsRoutes = new Hono();

specsRoutes.use("*", requerirSesion);

specsRoutes.get("/", async (c) => {
  return c.json({ specs: await Specs.all() });
});

specsRoutes.put("/:area", requerirTecnico, async (c) => {
  const area = c.req.param("area");
  if (!AREA_IDS.includes(area)) return c.json({ error: "Área inválida." }, 400);

  const body = await c.req.json().catch(() => ({}));
  const { nombre, afirmaciones, tiposTexto } = body;
  if (!Array.isArray(afirmaciones)) return c.json({ error: "Falta el arreglo de afirmaciones." }, 400);

  const sumaAfirmaciones = afirmaciones.reduce((s: number, a: any) => s + Number(a.peso || 0), 0);
  if (afirmaciones.length > 0 && sumaAfirmaciones !== 100) {
    return c.json({ error: `Los pesos de las afirmaciones deben sumar 100% (suman ${sumaAfirmaciones}%).` }, 400);
  }

  const spec = await Specs.upsert(area, { nombre: nombre || area, afirmaciones, tiposTexto });
  return c.json({ spec });
});
