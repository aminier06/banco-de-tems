# Banco de Ítems — despliegue como prototipo (Supabase Edge Functions)

Esta versión reemplaza el backend en Node/Express por una sola Edge Function
(`api`, en Deno/TypeScript con Hono), igual que la plataforma de
campamentos. El frontend en React/Vite no cambió: solo apunta a una URL
distinta.

```
Frontend (React/Vite, estático)  ──HTTPS──▶  Edge Function "api" (Deno)  ──▶  Postgres (Supabase)
```

Todo corre dentro del plan gratuito de Supabase, más un hosting estático
gratuito para el frontend. No necesitas Render/Railway/Fly.io para esto:
al ser Edge Functions, Supabase ya te da dónde correrlas.

## 0. Qué necesitas

- Una cuenta de Supabase (gratis, sin tarjeta).
- El CLI de Supabase que ya tienes instalado vía Scoop para el proyecto de
  campamentos.
- Node.js 18+ para compilar el frontend.

> Nota sobre el plan gratuito de Supabase: tienes derecho a **2 proyectos
> activos**. Si el de "Aprender es Divertido" ya ocupa uno, este Banco de
> Ítems puede usar el segundo. Los proyectos gratuitos se pausan tras 7 días
> sin actividad (se reactivan con un clic; los datos no se pierden), así que
> para una demo puntual no hay problema, pero si la vas a dejar viva conviene
> un ping periódico (un cron gratuito en GitHub Actions, por ejemplo) o, más
> adelante, pasar a un plan pago.

## 1. Crear el proyecto de Supabase

1. En el dashboard de Supabase, crea un proyecto nuevo (distinto al de
   campamentos) — por ejemplo, `banco-items-minerd`.
2. Guarda la contraseña de base de datos que definas ahí; la necesitarás en
   el paso 3.

## 2. Crear las tablas

1. En el proyecto, abre **SQL Editor → New query**.
2. Pega el contenido completo de `db/schema.sql` (incluido en este paquete)
   y ejecútalo. Es idempotente: puedes volver a correrlo sin romper nada.
3. Verifica en **Table Editor** que aparecen `users`, `specs`, `items` y
   `tests`.

## 3. Obtener la cadena de conexión (Transaction Pooler)

A diferencia del backend en Express (que usaba el **Session pooler**,
pensado para un servidor que vive corriendo), una Edge Function es
serverless de corta duración, así que aquí corresponde el
**Transaction pooler** (puerto **6543**):

1. En el dashboard, clic en **Connect** (arriba) → pestaña **Transaction
   pooler**.
2. Copia la cadena, que se ve así:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
3. Reemplaza `[YOUR-PASSWORD]` por la contraseña que definiste en el paso 1.

## 4. Configurar secretos y desplegar la función

Desde PowerShell, dentro de la carpeta de este proyecto (la que contiene
`supabase/functions/api`):

```powershell
# Vincula el CLI a tu proyecto (pide el project ref, lo ves en la URL del dashboard)
supabase link --project-ref <PROJECT_REF>

# Secretos que usa la función
supabase secrets set DATABASE_URL="postgresql://postgres.xxxx:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
supabase secrets set JWT_SECRET="genera-uno-largo-y-aleatorio-aqui"
supabase secrets set JWT_EXPIRES_IN="8h"
supabase secrets set CORS_ORIGIN="http://localhost:5173"
supabase secrets set SEED_SECRET="otro-valor-aleatorio-solo-para-sembrar-datos"

# Despliegue (mismo patrón que usas para el "api" de campamentos)
supabase functions deploy api --no-verify-jwt
```

`--no-verify-jwt` es necesario porque esta función maneja su **propia**
autenticación (JWT propio + bcrypt), no la de Supabase Auth — igual que el
backend en Express. Sin ese flag, la pasarela de Supabase rechazaría las
peticiones antes de que tu código las viera.

Para generar un valor aleatorio largo para `JWT_SECRET` y `SEED_SECRET`,
puedes usar PowerShell:
```powershell
-join ((48..57)+(65..90)+(97..122)|Get-Random -Count 40|%{[char]$_})
```

## 5. Sembrar datos de demostración

Una sola vez, después del primer despliegue:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://<PROJECT_REF>.supabase.co/functions/v1/api/admin/seed" `
  -Headers @{ "x-seed-secret" = "el-mismo-valor-que-pusiste-en-SEED_SECRET" }
```

Esto crea las 4 cuentas de demostración (mismas que en el README original:
`marisol.tavarez@minerd.gob.do`, `ivan.reyes@minerd.gob.do`,
`patricia.nunez@minerd.gob.do`, `daniel.cabrera@minerd.gob.do`, todas con
contraseña `Cambiar123!`), las especificaciones de las 4 áreas y un ítem de
ejemplo aprobado.

## 6. Probar la función

```powershell
Invoke-RestMethod "https://<PROJECT_REF>.supabase.co/functions/v1/api/health"

Invoke-RestMethod -Method Post `
  -Uri "https://<PROJECT_REF>.supabase.co/functions/v1/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"correo":"daniel.cabrera@minerd.gob.do","password":"Cambiar123!"}'
```

Si el login devuelve un `token`, la función ya está leyendo y escribiendo en
tu Supabase.

## 7. Frontend

El código del frontend no cambió; solo la URL a la que apunta.

```powershell
cd frontend
cp .env.example .env
# Edita .env y reemplaza <PROJECT_REF> por el de tu proyecto
npm install
npm run build      # genera frontend/dist
```

Para una demo local rápida: `npm run dev` (con `.env` apuntando a tu
función ya desplegada, o a `supabase functions serve` en local).

### Subir `dist/` a un hosting gratuito

Cualquiera de estos sirve sin costo y sin tarjeta. Recomiendo Render porque
sus sitios estáticos no se "duermen" (a diferencia de los web services):

- **Render → Static Site**: conecta el repositorio, build command
  `npm run build`, publish directory `frontend/dist`. Gratis, sin sleep,
  sin tarjeta.
- **Vercel / Netlify**: igual de sencillos, pero ojo — el plan gratuito de
  Vercel ("Hobby") es solo para uso personal/no comercial según sus
  términos; para un sistema institucional del MINERD, Render o Netlify
  evitan esa zona gris.

Una vez tengas la URL del frontend desplegado, actualiza el secreto
`CORS_ORIGIN` para que apunte a ella en vez de `localhost`:

```powershell
supabase secrets set CORS_ORIGIN="https://tu-frontend.onrender.com"
supabase functions deploy api --no-verify-jwt
```

## Resumen de costo: $0

| Pieza | Dónde vive | Plan |
|---|---|---|
| Base de datos | Supabase Postgres | Free (500 MB, se pausa tras 7 días de inactividad) |
| Backend | Supabase Edge Function `api` | Free (500,000 invocaciones/mes incluidas) |
| Frontend | Render Static Site (o Vercel/Netlify) | Free |

## Pendiente antes de manejar ítems reales (igual que señalaba ARCHITECTURE.md)

- Cambiar las 4 contraseñas de demostración (o borrar esas cuentas y crear
  las reales desde el panel de administración).
- Cambiar `SEED_SECRET` por un valor que ya no comuniques a nadie, o quitar
  la ruta `/admin/seed` del código y volver a desplegar.
- Decidir con el equipo de TI del MINERD: dominio propio, HTTPS (ya viene
  por defecto en Supabase y en el hosting estático), backups, y si conviene
  pasar a un plan pago de Supabase antes de una convocatoria oficial (la
  pausa por inactividad y el límite de 500 MB son aceptables para un
  prototipo, no para producción real).
- Revisar si el banco de ítems necesita políticas adicionales de
  confidencialidad antes de una convocatoria oficial (esto ya se señalaba en
  `ARCHITECTURE.md`, sigue aplicando aquí).
