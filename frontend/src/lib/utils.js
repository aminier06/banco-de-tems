import Papa from "papaparse";
import * as XLSX from "xlsx";
import { AREAS, DIFICULTADES } from "./constants.js";

export const contarPalabras = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;
export const hoy = () => new Date().toISOString().slice(0, 10);

export const normalizar = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function resolverArea(valor) {
  const v = normalizar(valor);
  if (!v) return null;
  const match = AREAS.find((a) => normalizar(a.id) === v || normalizar(a.abrev) === v || normalizar(a.nombre) === v);
  return match ? match.id : null;
}

export function resolverDificultad(valor) {
  const v = normalizar(valor);
  const match = DIFICULTADES.find((d) => normalizar(d) === v);
  return match || null;
}

export function resolverIndiceRespuesta(valor) {
  const v = normalizar(valor);
  if (v === "a" || v === "1") return 0;
  if (v === "b" || v === "2") return 1;
  if (v === "c" || v === "3") return 2;
  if (v === "d" || v === "4") return 3;
  const n = Number(v);
  if (!isNaN(n) && n >= 0 && n <= 3 && v !== "") return n;
  return null;
}

export function resolverClasificacion(areaId, competenciaRaw, afirmacionRaw, evidenciaRaw, tareaRaw, specs) {
  const spec = specs[areaId];
  const vacio = { competenciaId: "", afirmacionId: "", evidenciaId: "", tareaId: "" };
  if (!spec) return vacio;
  const competencias = Array.isArray(spec.competencias)
    ? spec.competencias
    : Array.isArray(spec.afirmaciones)
    ? [{ id: "principal", nombre: spec.nombre || "", afirmaciones: spec.afirmaciones }]
    : [];
  if (competencias.length === 0) return vacio;
  const cv = normalizar(competenciaRaw);
  const comp = cv
    ? competencias.find((c) => normalizar(c.id) === cv || normalizar(c.nombre) === cv)
    : competencias.length === 1
    ? competencias[0]
    : null;
  if (!comp) return vacio;
  const afv = normalizar(afirmacionRaw);
  const af = (comp.afirmaciones || []).find((a) => normalizar(a.id) === afv || normalizar(a.texto) === afv);
  if (!af) return { ...vacio, competenciaId: comp.id };
  const evv = normalizar(evidenciaRaw);
  const ev = (af.evidencias || []).find((e) => normalizar(e.id) === evv || normalizar(e.texto) === evv);
  if (!ev) return { ...vacio, competenciaId: comp.id, afirmacionId: af.id };
  const tv = normalizar(tareaRaw);
  const t = (ev.tareas || []).find((x) => normalizar(x.id) === tv || normalizar(x.texto) === tv);
  return { competenciaId: comp.id, afirmacionId: af.id, evidenciaId: ev.id, tareaId: t ? t.id : "" };
}

export function resolverAutor(valor, users, fallbackId) {
  const v = normalizar(valor);
  if (!v) return fallbackId;
  const match = users.find((u) => normalizar(u.nombre) === v || normalizar(u.correo) === v);
  return match ? match.id : fallbackId;
}

export const CAMPOS_IMPORTACION = [
  { key: "area", label: "Área", requerido: true },
  { key: "competencia", label: "Competencia (código o nombre)", requerido: false },
  { key: "afirmacion", label: "Afirmación (código o texto)", requerido: false },
  { key: "evidencia", label: "Evidencia (código o texto)", requerido: false },
  { key: "tarea", label: "Tarea (código o texto)", requerido: false },
  { key: "dificultad", label: "Dificultad", requerido: false },
  { key: "tipoTexto", label: "Tipo de texto", requerido: false },
  { key: "contexto", label: "Contexto / texto base", requerido: false },
  { key: "enunciado", label: "Enunciado", requerido: true },
  { key: "opcionA", label: "Opción A", requerido: true },
  { key: "opcionB", label: "Opción B", requerido: true },
  { key: "opcionC", label: "Opción C", requerido: true },
  { key: "opcionD", label: "Opción D", requerido: true },
  { key: "respuestaCorrecta", label: "Respuesta correcta (A–D)", requerido: true },
  { key: "justificacionCorrecta", label: "Justificación de la respuesta", requerido: false },
  { key: "justificacionDistractores", label: "Justificación de distractores", requerido: false },
  { key: "autor", label: "Autor/a original", requerido: false },
];

export async function parseArchivoBanco(file) {
  const nombre = file.name.toLowerCase();
  if (nombre.endsWith(".csv")) {
    const texto = await file.text();
    const parsed = Papa.parse(texto, { header: true, skipEmptyLines: true });
    return { headers: parsed.meta.fields || [], rows: parsed.data };
  }
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export function autoMapearColumnas(headers) {
  const limpio = (s) => normalizar(s).replace(/[^a-z0-9]/g, "");
  const mapping = {};
  CAMPOS_IMPORTACION.forEach((c) => {
    const objetivo = limpio(c.key);
    const match = headers.find((h) => limpio(h) === objetivo);
    mapping[c.key] = match || "";
  });
  return mapping;
}

export function descargarPlantillaCSV() {
  const ejemplo = {
    area: "lengua",
    competencia: "comprension-lectora",
    afirmacion: "A1",
    evidencia: "1.2",
    tarea: "1.2.1",
    dificultad: "Baja",
    tipoTexto: "narrativo",
    contexto: "Texto de hasta 350 palabras sobre el que se basa la pregunta.",
    enunciado: "¿Qué información del texto permite responder la pregunta?",
    opcionA: "Opción correcta",
    opcionB: "Distractor 1",
    opcionC: "Distractor 2",
    opcionD: "Distractor 3",
    respuestaCorrecta: "A",
    justificacionCorrecta: "Explica por qué la opción A es correcta.",
    justificacionDistractores: "Explica por qué B, C y D son incorrectas.",
    autor: "Nombre de quien elaboró el ítem originalmente",
  };
  const headers = CAMPOS_IMPORTACION.map((c) => c.key);
  const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(csvCell).join(","), headers.map((h) => csvCell(ejemplo[h])).join(",")].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_banco_items.csv";
  a.click();
  URL.revokeObjectURL(url);
}
