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
