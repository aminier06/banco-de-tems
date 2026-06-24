import { Hono } from "jsr:@hono/hono@4";
import bcrypt from "npm:bcryptjs@2.4.3";
import { Users, toPublic } from "../models/users.ts";
import { firmarToken, requerirSesion } from "../auth.ts";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { correo, password } = body;
  if (!correo || !password) {
    return c.json({ error: "Correo y contraseña son obligatorios." }, 400);
  }
  const user = await Users.findByCorreo(correo.trim().toLowerCase());
  if (!user) return c.json({ error: "Correo o contraseña incorrectos." }, 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return c.json({ error: "Correo o contraseña incorrectos." }, 401);

  const token = firmarToken(user);
  return c.json({ token, user: toPublic(user) });
});

authRoutes.get("/me", requerirSesion, (c) => {
  return c.json({ user: toPublic(c.get("user")) });
});

// Autoservicio: cualquier persona autenticada puede cambiar su propia
// contraseña, sin importar su rol. Distinto del "restablecer" que usa el
// administrador desde la pestaña Usuarios (ese no pide la contraseña actual).
authRoutes.post("/change-password", requerirSesion, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const { passwordActual, passwordNueva } = body;
  if (!passwordActual || !passwordNueva) {
    return c.json({ error: "Indica tu contraseña actual y la nueva." }, 400);
  }
  if (passwordNueva.length < 4) {
    return c.json({ error: "La nueva contraseña debe tener al menos 4 caracteres." }, 400);
  }
  const ok = await bcrypt.compare(passwordActual, user.passwordHash);
  if (!ok) return c.json({ error: "Tu contraseña actual no es correcta." }, 401);

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await Users.updatePassword(user.id, passwordHash);
  return c.json({ ok: true });
});
