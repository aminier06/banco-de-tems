import { Hono } from "jsr:@hono/hono@4";
import { Specs } from "../models/specs.ts";
import { requerirSesion, requerirTecnico } from "../auth.ts";
import { AREA_IDS } from "../constants.ts";

export const specsRoutes = new Hono();

specsRoutes.use("*", requerirSesion);

specsRoutes.get("/", async (c) => {
  return c.json({ specs: await Specs.all() });
});

// Un area puede tener varias competencias (ej. en Lengua: "Comprension lectora"
// y "Produccion de textos"), cada una con su propio arbol Afirmacion -> Evidencia -> Tarea.
specsRoutes.put("/:area", requerirTecnico, async (c) => {
  const area = c.req.param("area");
  if (!AREA_IDS.includes(area)) return c.json({ error: "Area invalida." }, 400);

  const body = await c.req.json().catch(() => ({}));
  const competencias = Array.isArray(body.competencias) ? body.competencias : null;
  if (!competencias) return c.json({ error: "Falta el arreglo de competencias." }, 400);

  for (const comp of competencias) {
    if (!comp.nombre || !String(comp.nombre).trim()) {
      return c.json({ error: "Cada competencia necesita un nombre." }, 400);
    }
    const afirmaciones = Array.isArray(comp.afirmaciones) ? comp.afirmaciones : [];
    const suma = afirmaciones.reduce((s: number, a: any) => s + Number(a.peso || 0), 0);
    if (afirmaciones.length > 0 && suma !== 100) {
      return c.json({ error: `En "${comp.nombre}": los pesos de las afirmaciones deben sumar 100% (suman ${suma}%).` }, 400);
    }
  }

  const spec = await Specs.upsert(area, { competencias });
  return c.json({ spec });
});
