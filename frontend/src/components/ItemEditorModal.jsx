import React, { useState } from "react";
import { Save } from "lucide-react";
import { AREAS, DIFICULTADES } from "../lib/constants.js";
import { contarPalabras } from "../lib/utils.js";
import { ModalShell, Banner } from "./shared.jsx";

export default function ItemEditorModal({ itemSeed, specs, currentUser, onClose, onSave }) {
  const esNuevo = itemSeed.nuevoEnArea !== undefined;
  const base = esNuevo
    ? {
        area: itemSeed.nuevoEnArea,
        afirmacionId: "",
        evidenciaId: "",
        tipoTexto: "",
        dificultad: "Media",
        contexto: "",
        enunciado: "",
        opciones: ["", "", "", ""],
        respuestaCorrecta: 0,
        justificacionCorrecta: "",
        justificacionDistractores: "",
        estado: "borrador",
        autorId: currentUser.id,
        autorNombre: currentUser.nombre,
        historial: [{ fecha: new Date().toISOString().slice(0, 10), autor: currentUser.nombre, accion: "Creación del ítem." }],
      }
    : itemSeed;

  const [form, setForm] = useState(base);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const soloLectura =
    !esNuevo &&
    !(itemSeed.autorId === currentUser.id && (itemSeed.estado === "borrador" || itemSeed.estado === "rechazado")) &&
    currentUser.rol !== "revisor" &&
    currentUser.rol !== "administrador";

  const spec = specs[form.area];
  const afirmaciones = spec?.afirmaciones || [];
  const afirmacionActual = afirmaciones.find((a) => a.id === form.afirmacionId);
  const evidencias = afirmacionActual?.evidencias || [];
  const tiposTexto = spec?.tiposTexto || [];

  const palabras = contarPalabras(form.contexto);
  const camposCompletos =
    form.afirmacionId && form.evidenciaId && form.enunciado.trim() && form.opciones.every((o) => o.trim()) && form.justificacionCorrecta.trim();

  const setOpcion = (idx, val) => {
    const next = [...form.opciones];
    next[idx] = val;
    setForm({ ...form, opciones: next });
  };

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      await onSave(form, esNuevo);
    } catch (err) {
      setError(err.message || "No se pudo guardar el ítem.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={esNuevo ? "Nuevo ítem" : soloLectura ? "Ver ítem" : "Editar ítem"} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="bib-label">Área</label>
          <select className="bib-select" disabled value={form.area} onChange={() => {}}>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Dificultad</label>
          <select className="bib-select" disabled={soloLectura} value={form.dificultad} onChange={(e) => setForm({ ...form, dificultad: e.target.value })}>
            {DIFICULTADES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Tipo de texto {tiposTexto.length === 0 && "(no configurado)"}</label>
          <select className="bib-select" disabled={soloLectura || tiposTexto.length === 0} value={form.tipoTexto || ""} onChange={(e) => setForm({ ...form, tipoTexto: e.target.value })}>
            <option value="">—</option>
            {tiposTexto.map((t) => (
              <option key={t.id} value={t.id}>{t.texto}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="bib-label">Afirmación</label>
          {afirmaciones.length === 0 ? (
            <Banner tone="amber">Esta área aún no tiene especificaciones configuradas. Pide al equipo técnico que las cargue en la pestaña "Especificaciones".</Banner>
          ) : (
            <select className="bib-select" disabled={soloLectura} value={form.afirmacionId || ""} onChange={(e) => setForm({ ...form, afirmacionId: e.target.value, evidenciaId: "" })}>
              <option value="">Selecciona…</option>
              {afirmaciones.map((a) => (
                <option key={a.id} value={a.id}>{a.id} — {a.texto} ({a.peso}%)</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="bib-label">Evidencia</label>
          <select className="bib-select" disabled={soloLectura || !afirmacionActual} value={form.evidenciaId || ""} onChange={(e) => setForm({ ...form, evidenciaId: e.target.value })}>
            <option value="">Selecciona…</option>
            {evidencias.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.id} — {ev.texto} ({ev.peso}%)</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Contexto (texto base, opcional pero recomendado — máx. ~350 palabras) · {palabras} palabra(s)</label>
        <textarea className="bib-textarea" disabled={soloLectura} rows={5} value={form.contexto || ""} onChange={(e) => setForm({ ...form, contexto: e.target.value })} placeholder="Texto autosuficiente sobre el que se basa la pregunta…" />
        {palabras > 350 && <div style={{ color: "var(--red)", fontSize: 11.5, marginTop: 4 }}>El texto supera las 350 palabras recomendadas.</div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Enunciado</label>
        <textarea className="bib-textarea" disabled={soloLectura} rows={2} value={form.enunciado} onChange={(e) => setForm({ ...form, enunciado: e.target.value })} placeholder="¿Qué se le pregunta al estudiante?" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Opciones de respuesta (marca la correcta)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {form.opciones.map((op, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="correcta" checked={form.respuestaCorrecta === idx} disabled={soloLectura} onChange={() => setForm({ ...form, respuestaCorrecta: idx })} />
              <span className="f-mono" style={{ fontSize: 12, width: 16 }}>{String.fromCharCode(65 + idx)}.</span>
              <input className="bib-input" disabled={soloLectura} value={op} onChange={(e) => setOpcion(idx, e.target.value)} placeholder={`Opción ${String.fromCharCode(65 + idx)}`} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div>
          <label className="bib-label">Justificación de la respuesta correcta</label>
          <textarea className="bib-textarea" disabled={soloLectura} rows={3} value={form.justificacionCorrecta || ""} onChange={(e) => setForm({ ...form, justificacionCorrecta: e.target.value })} />
        </div>
        <div>
          <label className="bib-label">Por qué los distractores son incorrectos</label>
          <textarea className="bib-textarea" disabled={soloLectura} rows={3} value={form.justificacionDistractores || ""} onChange={(e) => setForm({ ...form, justificacionDistractores: e.target.value })} />
        </div>
      </div>

      {form.historial?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <label className="bib-label">Historial</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {form.historial.map((h, idx) => (
              <div key={idx} style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                <span className="f-mono">{h.fecha}</span> — <strong>{h.autor}</strong>: {h.accion}
                {h.comentario && <em> "{h.comentario}"</em>}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

      {!soloLectura && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="bib-btn bib-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="bib-btn bib-btn-primary" disabled={!camposCompletos || guardando} onClick={guardar}>
            <Save size={14} /> {guardando ? "Guardando…" : esNuevo ? "Guardar como borrador" : "Guardar cambios"}
          </button>
        </div>
      )}
    </ModalShell>
  );
}
