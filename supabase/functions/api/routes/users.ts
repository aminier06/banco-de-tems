import { Hono } from "jsr:@hono/hono@4";
import bcrypt from "npm:bcryptjs@2.4.3";
import { Users, toPublic } from "../models/users.ts";
import { requerirAdmin } from "../auth.ts";
import { ROLES, AREA_IDS } from "../constants.ts";

export const usersRoutes = new Hono();

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(2, 10);
}

function validarPayload(body: any, { exigirPassword }: { exigirPassword: boolean }) {
  const errores: string[] = [];
  if (!body.nombre || !body.nombre.trim()) errores.push("Falta el nombre.");
  if (!body.correo || !body.correo.trim()) errores.push("Falta el correo.");
  if (!ROLES.includes(body.rol)) errores.push("Rol inválido.");
  if (body.rol === "elaborador" && !AREA_IDS.includes(body.area)) errores.push("El elaborador necesita un área válida.");
  if (exigirPassword && (!body.password || body.password.length < 4)) errores.push("La contraseña debe tener al menos 4 caracteres.");
  return errores;
}

// Todas las rutas de este archivo requieren rol administrador.
usersRoutes.use("*", requerirAdmin);

usersRoutes.get("/", async (c) => {
  const users = await Users.list();
  return c.json({ users: users.map(toPublic) });
});

usersRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errores = validarPayload(body, { exigirPassword: true });
  if (errores.length) return c.json({ error: errores.join(" ") }, 400);

  const correo = body.correo.trim().toLowerCase();
  if (await Users.findByCorreo(correo)) return c.json({ error: "Ya existe una cuenta con ese correo." }, 409);

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await Users.create({
    nombre: body.nombre.trim(),
    correo,
    passwordHash,
    rol: body.rol,
    area: body.rol === "elaborador" ? body.area : null,
  });
  return c.json({ user: toPublic(user) }, 201);
});

usersRoutes.put("/:id", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const errores = validarPayload(body, { exigirPassword: false });
  if (errores.length) return c.json({ error: errores.join(" ") }, 400);

  const id = c.req.param("id");
  const correo = body.correo.trim().toLowerCase();
  const otro = await Users.findByCorreo(correo);
  if (otro && otro.id !== id) return c.json({ error: "Ese correo ya está en uso por otra cuenta." }, 409);

  if (!(await Users.findById(id))) return c.json({ error: "Usuario no encontrado." }, 404);

  const user = await Users.update(id, {
    nombre: body.nombre.trim(),
    correo,
    rol: body.rol,
    area: body.rol === "elaborador" ? body.area : null,
  });
  return c.json({ user: toPublic(user) });
});

usersRoutes.post("/:id/reset-password", async (c) => {
  const id = c.req.param("id");
  if (!(await Users.findById(id))) return c.json({ error: "Usuario no encontrado." }, 404);
  const body = await c.req.json().catch(() => ({}));
  const nueva = body.password || generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(nueva, 10);
  await Users.updatePassword(id, passwordHash);
  // Se devuelve la contraseña en texto plano una sola vez para que el
  // administrador la comparta con la persona; nunca queda almacenada así.
  return c.json({ password: nueva });
});

usersRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const actual = c.get("user");
  if (id === actual.id) {
    return c.json({ error: "No puedes eliminar tu propia cuenta mientras tienes la sesión abierta." }, 400);
  }
  const eliminado = await Users.remove(id);
  if (!eliminado) return c.json({ error: "Usuario no encontrado." }, 404);
  return c.body(null, 204);
});
