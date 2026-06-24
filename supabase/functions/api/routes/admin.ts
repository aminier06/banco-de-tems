import { Hono } from "jsr:@hono/hono@4";
import bcrypt from "npm:bcryptjs@2.4.3";
import { Users } from "../models/users.ts";
import { Specs } from "../models/specs.ts";
import { Items } from "../models/items.ts";

export const adminRoutes = new Hono();

// Endpoint de siembra de datos de demostración, equivalente a "npm run seed"
// del backend en Express. Se protege con un secreto aparte (SEED_SECRET)
// porque se usa antes de que exista ningún usuario para iniciar sesión.
// Es seguro llamarlo varias veces: no duplica nada que ya exista.
//
// Recomendación: una vez sembrados los datos, considera cambiar
// SEED_SECRET por uno que ya no compartas, para cerrar esta puerta.
adminRoutes.post("/seed", async (c) => {
  const secreto = c.req.header("x-seed-secret");
  if (!secreto || secreto !== Deno.env.get("SEED_SECRET")) {
    return c.json({ error: "No autorizado." }, 401);
  }

  const credenciales = [
    { nombre: "Marisol Tavárez", correo: "marisol.tavarez@minerd.gob.do", password: "Cambiar123!", rol: "elaborador", area: "lengua" },
    { nombre: "Iván Reyes", correo: "ivan.reyes@minerd.gob.do", password: "Cambiar123!", rol: "elaborador", area: "ciencias_naturaleza" },
    { nombre: "Patricia Núñez", correo: "patricia.nunez@minerd.gob.do", password: "Cambiar123!", rol: "revisor", area: null },
    { nombre: "Daniel Cabrera", correo: "daniel.cabrera@minerd.gob.do", password: "Cambiar123!", rol: "administrador", area: null },
  ];

  const usuarios: Record<string, any> = {};
  for (const cr of credenciales) {
    let user = await Users.findByCorreo(cr.correo);
    if (!user) {
      const passwordHash = await bcrypt.hash(cr.password, 10);
      user = await Users.create({ nombre: cr.nombre, correo: cr.correo, passwordHash, rol: cr.rol, area: cr.area });
    }
    usuarios[cr.correo] = user;
  }

  if (!(await Specs.get("lengua"))) {
    await Specs.upsert("lengua", {
      nombre: "Comprensión lectora en Lengua Española",
      afirmaciones: [
        {
          id: "A1",
          texto: "Identifica información literal en el texto.",
          peso: 30,
          evidencias: [
            { id: "1.1", texto: "Identifica y entiende el vocabulario y su función en el texto.", peso: 10, tareas: [] },
            {
            id: "1.2",
            texto: "Identifica elementos del contenido (cantidades, hechos, tiempo, lugares, personajes, etc.).",
            peso: 20,
            tareas: [
              {
                id: "1.2.1",
                texto: "Selecciona la opción que identifica correctamente un elemento explícito del contenido (personaje, lugar, hecho o dato) presente en el texto.",
                peso: 100,
              },
            ],
          },
          ],
        },
        {
          id: "A2",
          texto: "Comprende el sentido global de un texto a partir de la comprensión de sus partes.",
          peso: 40,
          evidencias: [
            { id: "2.1", texto: "Identifica la intención comunicativa del autor en una parte de un texto.", peso: 5, tareas: [] },
            { id: "2.2", texto: "Identifica las funciones de las partes en las que se estructura un texto.", peso: 5, tareas: [] },
            { id: "2.3", texto: "Identifica la relación entre las voces presentes en un texto.", peso: 6, tareas: [] },
            { id: "2.4", texto: "Reconoce las ideas centrales de cada parte funcional del texto y las relaciones entre ellas.", peso: 8, tareas: [] },
            { id: "2.5", texto: "Establece relaciones entre elementos lingüísticos y no lingüísticos en un texto.", peso: 6, tareas: [] },
            { id: "2.6", texto: "Reconoce síntesis, análisis y paráfrasis apropiadas de un texto.", peso: 10, tareas: [] },
          ],
        },
        {
          id: "A3",
          texto: "Asume una posición crítica sobre el texto.",
          peso: 30,
          evidencias: [
            { id: "3.1", texto: "Evalúa el contenido de enunciados instructivos en un texto.", peso: 6, tareas: [] },
            { id: "3.2", texto: "Identifica enunciados implícitos y evalúa críticamente las ideas expresadas en un texto.", peso: 8, tareas: [] },
            { id: "3.3", texto: "Establece relaciones entre diferentes textos.", peso: 8, tareas: [] },
            { id: "3.4", texto: "Comprende el propósito discursivo de un texto.", peso: 8, tareas: [] },
          ],
        },
      ],
      tiposTexto: [
        { id: "narrativo", texto: "Narrativos y poéticos", peso: 30 },
        { id: "expositivo", texto: "Expositivos", peso: 30 },
        { id: "argumentativo", texto: "Argumentativos", peso: 25 },
        { id: "directivo", texto: "Directivos", peso: 15 },
      ],
    });
  }
  for (const area of ["ciencias_naturaleza", "ciencias_sociales", "matematica"]) {
    if (!(await Specs.get(area))) await Specs.upsert(area, { nombre: area, afirmaciones: [], tiposTexto: [] });
  }

  const autor = usuarios["marisol.tavarez@minerd.gob.do"];
  const yaHayItems = (await Items.list({ area: "lengua" })).length > 0;
  if (!yaHayItems) {
    await Items.create(
      {
        area: "lengua",
        afirmacionId: "A1",
        evidenciaId: "1.2",
        tareaId: "1.2.1",
        tipoTexto: "narrativo",
        dificultad: "Baja",
        contexto:
          "En el liceo Las Flores, un grupo de catorce estudiantes se reúne todos los viernes en el club de robótica. Construyen pequeños vehículos con piezas recicladas: motores de juguetes viejos, ruedas de patines y cartón. La profesora que los acompaña no les da instrucciones cerradas; más bien, les plantea un reto semanal y los deja experimentar.",
        enunciado: "De acuerdo con el texto, ¿qué hace la profesora del club de robótica frente a los retos semanales?",
        opciones: [
          "Da instrucciones cerradas para que los estudiantes las sigan paso a paso.",
          "Plantea el reto y deja que los estudiantes experimenten por su cuenta.",
          "Resuelve ella misma las fallas de los vehículos antes de mostrarlas al grupo.",
          "Evalúa los vehículos únicamente al final del año escolar.",
        ],
        respuestaCorrecta: 1,
        justificacionCorrecta: "El texto indica que la profesora no da instrucciones cerradas y deja experimentar a los estudiantes.",
        justificacionDistractores: "Las demás opciones contradicen o no están respaldadas por el texto.",
        estado: "aprobado",
        historial: [
          { fecha: "2026-03-02", autor: autor.nombre, accion: "Creación del ítem." },
          { fecha: "2026-03-05", autor: "Patricia Núñez", accion: "Aprobado." },
        ],
      },
      autor.id
    );
  }

  return c.json({
    ok: true,
    cuentas: credenciales.map((cr) => ({ correo: cr.correo, password: cr.password, rol: cr.rol })),
  });
});
