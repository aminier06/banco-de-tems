-- Esquema de base de datos para PostgreSQL (Supabase u otro proveedor).
-- Ejecutar pegando este archivo completo en Supabase > SQL Editor > New query > Run.
-- Es seguro volver a ejecutarlo: todo usa IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL,
  area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS specs (
  area TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  afirmacion_id TEXT,
  evidencia_id TEXT,
  tarea_id TEXT,
  competencia_id TEXT,
  imagen_url TEXT,
  tipo_texto TEXT,
  dificultad TEXT NOT NULL,
  contexto TEXT,
  enunciado TEXT NOT NULL,
  opciones JSONB NOT NULL,
  respuesta_correcta INTEGER NOT NULL,
  justificacion_correcta TEXT,
  justificacion_distractores TEXT,
  estado TEXT NOT NULL,
  historial JSONB NOT NULL,
  autor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Si la tabla ya existía de antes de este cambio, esto agrega la columna sin perder datos:
ALTER TABLE items ADD COLUMN IF NOT EXISTS tarea_id TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS competencia_id TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS imagen_url TEXT;
CREATE INDEX IF NOT EXISTS idx_items_area_estado ON items(area, estado);

CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  area TEXT NOT NULL,
  grado TEXT NOT NULL,
  convocatoria TEXT NOT NULL,
  total_items INTEGER NOT NULL,
  item_ids JSONB NOT NULL,
  creado_por_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
