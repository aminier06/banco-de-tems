import jwt from "npm:jsonwebtoken@9.0.2";
import { Users, toPublic } from "./models/users.ts";
import { esTecnico, esAdmin } from "./constants.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET");
const JWT_EXPIRES_IN = Deno.env.get("JWT_EXPIRES_IN") || "8h";

if (!JWT_SECRET) {
  // Falla rápido: nunca arrancar con un secreto vacío.
  throw new Error(
    "Falta el secreto JWT_SECRET. Configúralo con: supabase secrets set JWT_SECRET=\"...\""
  );
}

export function firmarToken(user: { id: string; rol: string }) {
  return jwt.sign({ sub: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Adjunta c.get("user") (registro completo y actualizado de la base de
// datos) si el token es válido. No rechaza la petición por sí solo: eso lo
// hacen los middlewares de abajo, para diferenciar 401 de 403.
export async function autenticar(c: any, next: any) {
  const header = c.req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    c.set("user", null);
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    c.set("user", (await Users.findById(payload.sub)) || null);
  } catch {
    c.set("user", null);
  }
  await next();
}

export async function requerirSesion(c: any, next: any) {
  if (!c.get("user")) return c.json({ error: "No autenticado." }, 401);
  await next();
}

export async function requerirTecnico(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ error: "No autenticado." }, 401);
  if (!esTecnico(user.rol)) {
    return c.json({ error: "Requiere rol de equipo técnico o administrador." }, 403);
  }
  await next();
}

export async function requerirAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ error: "No autenticado." }, 401);
  if (!esAdmin(user.rol)) {
    return c.json({ error: "Requiere rol de administrador." }, 403);
  }
  await next();
}

export { toPublic as userPublico };
