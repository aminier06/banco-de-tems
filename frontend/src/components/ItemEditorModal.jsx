import React, { useState } from "react";
import { Save, ImagePlus, X } from "lucide-react";
import { AREAS, DIFICULTADES } from "../lib/constants.js";
import { contarPalabras } from "../lib/utils.js";
import { ModalShell, Banner } from "./shared.jsx";

export default function ItemEditorModal({ itemSeed, specs, currentUser, onClose, onSave, onUploadImagen }) {
  const esNuevo = itemSeed.nuevoEnArea !== undefined;
  const base = esNuevo
    ? {
        area: itemSeed.nuevoEnArea,
        competenciaId: "",
        afirmacionId: "",
        evidenciaId: "",
        tareaId: "",
        imagenUrl: "",
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
        historial: [{ fecha: new Date().toISOString().slice(0, 10), autor: currentUser.nombre, accion: "Creacion del item." }],
      }
    : itemSeed;

  const [form, setForm] = useState(base);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState("");

  const soloLectura =
    !esNuevo &&
    !(itemSeed.autorId === currentUser.id && (itemSeed.estado === "borrador" || itemSeed.estado === "rechazado")) &&
    currentUser.rol !== "revisor" &&
    currentUser.rol !== "administrador";

  const spec = specs[form.area];
  // Compatibilidad: si el area todavia no migro a la forma con "competencias",
  // se trata su unica tabla de afirmaciones como una competencia "principal".
  const competencias = Array.isArray(spec?.competencias)
    ? spec.competencias
    : Array.isArray(spec?.afirmaciones)
    ? [{ id: "principal", nombre: spec.nombre || "", afirmaciones: spec.afirmaciones, tiposTexto: spec.tiposTexto || [] }]
    : [];
  const competenciaActual = competencias.find((c) => c.id === form.competenciaId);
  const afirmaciones = competenciaActual?.afirmaciones || [];
  const afirmacionActual = afirmaciones.find((a) => a.id === form.afirmacionId);
  const evidencias = afirmacionActual?.evidencias || [];
  const evidenciaActual = evidencias.find((ev) => ev.id === form.evidenciaId);
  const tareas = evidenciaActual?.tareas || [];
  const tiposTexto = competenciaActual?.tiposTexto || [];

  const palabras = contarPalabras(form.contexto);
  const camposCompletos =
    form.competenciaId &&
    form.afirmacionId &&
    form.evidenciaId &&
    form.enunciado.trim() &&
    form.opciones.every((o) => o.trim()) &&
    form.justificacionCorrecta.trim();

  const setOpcion = (idx, val) => {
    const next = [...form.opciones];
    next[idx] = val;
    setForm({ ...form, opciones: next });
  };

  const subirImagen = async (archivo) => {
    setErrorImagen("");
    setSubiendoImagen(true);
    try {
      const url = await onUploadImagen(archivo);
      setForm({ ...form, imagenUrl: url });
    } catch (err) {
      setErrorImagen(err.message || "No se pudo subir la imagen.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      await onSave(form, esNuevo);
    } catch (err) {
      setError(err.message || "No se pudo guardar el item.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title={esNuevo ? "Nuevo item" : soloLectura ? "Ver item" : "Editar item"} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="bib-label">Area</label>
          <select className="bib-select" disabled value={form.area} onChange={() => {}}>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Competencia</label>
          {competencias.length === 0 ? (
            <Banner tone="amber">Esta area aun no tiene ninguna competencia configurada. Pide al equipo tecnico que la cree en la pestana "Especificaciones".</Banner>
          ) : (
            <select
              className="bib-select"
              disabled={soloLectura}
              value={form.competenciaId || ""}
              onChange={(e) => setForm({ ...form, competenciaId: e.target.value, afirmacionId: "", evidenciaId: "", tareaId: "", tipoTexto: "" })}
            >
              <option value="">Selecciona...</option>
              {competencias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre || c.id}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="bib-label">Dificultad</label>
          <select className="bib-select" disabled={soloLectura} value={form.dificultad} onChange={(e) => setForm({ ...form, dificultad: e.target.value })}>
            {DIFICULTADES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="bib-label">Tipo de texto {tiposTexto.length === 0 && "(no configurado)"}</label>
          <select className="bib-select" disabled={soloLectura || tiposTexto.length === 0} value={form.tipoTexto || ""} onChange={(e) => setForm({ ...form, tipoTexto: e.target.value })}>
            <option value="">-</option>
            {tiposTexto.map((t) => (
              <option key={t.id} value={t.id}>{t.texto}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Afirmacion</label>
          <select
            className="bib-select"
            disabled={soloLectura || !competenciaActual}
            value={form.afirmacionId || ""}
            onChange={(e) => setForm({ ...form, afirmacionId: e.target.value, evidenciaId: "", tareaId: "" })}
          >
            <option value="">Selecciona...</option>
            {afirmaciones.map((a) => (
              <option key={a.id} value={a.id}>{a.id} - {a.texto} ({a.peso}%)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Evidencia</label>
          <select className="bib-select" disabled={soloLectura || !afirmacionActual} value={form.evidenciaId || ""} onChange={(e) => setForm({ ...form, evidenciaId: e.target.value, tareaId: "" })}>
            <option value="">Selecciona...</option>
            {evidencias.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.id} - {ev.texto} ({ev.peso}%)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Tarea {evidenciaActual && tareas.length === 0 && "(sin definir)"}</label>
          <select className="bib-select" disabled={soloLectura || !evidenciaActual || tareas.length === 0} value={form.tareaId || ""} onChange={(e) => setForm({ ...form, tareaId: e.target.value })}>
            <option value="">Selecciona...</option>
            {tareas.map((t) => (
              <option key={t.id} value={t.id}>{t.id} - {t.texto} ({t.peso}%)</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Contexto (texto base, opcional pero recomendado - max. ~350 palabras) - {palabras} palabra(s)</label>
        <textarea className="bib-textarea" disabled={soloLectura} rows={5} value={form.contexto || ""} onChange={(e) => setForm({ ...form, contexto: e.target.value })} placeholder="Texto autosuficiente sobre el que se basa la pregunta..." />
        {palabras > 350 && <div style={{ color: "var(--red)", fontSize: 11.5, marginTop: 4 }}>El texto supera las 350 palabras recomendadas.</div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Imagen (mapa, grafico o ilustracion - opcional, maximo 5 MB)</label>
        {form.imagenUrl ? (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <img src={form.imagenUrl} alt="Imagen del item" style={{ maxWidth: 240, maxHeight: 160, objectFit: "contain", border: "1px solid var(--rule)", borderRadius: 3, background: "#fff" }} />
            {!soloLectura && (
              <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => setForm({ ...form, imagenUrl: "" })}>
                <X size={13} /> Quitar imagen
              </button>
            )}
          </div>
        ) : (
          !soloLectura && (
            <label className="bib-btn bib-btn-ghost" style={{ display: "inline-flex", cursor: subiendoImagen ? "default" : "pointer" }}>
              <ImagePlus size={14} /> {subiendoImagen ? "Subiendo..." : "Subir imagen"}
              <input
                type="file"
                accept="image/*"
                disabled={subiendoImagen}
                style={{ display: "none" }}
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  if (archivo) subirImagen(archivo);
                  e.target.value = "";
                }}
              />
            </label>
          )
        )}
        {errorImagen && <div style={{ color: "var(--red)", fontSize: 11.5, marginTop: 4 }}>{errorImagen}</div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Enunciado</label>
        <textarea className="bib-textarea" disabled={soloLectura} rows={2} value={form.enunciado} onChange={(e) => setForm({ ...form, enunciado: e.target.value })} placeholder="Que se le pregunta al estudiante?" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="bib-label">Opciones de respuesta (marca la correcta)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {form.opciones.map((op, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="correcta" checked={form.respuestaCorrecta === idx} disabled={soloLectura} onChange={() => setForm({ ...form, respuestaCorrecta: idx })} />
              <span className="f-mono" style={{ fontSize: 12, width: 16 }}>{String.fromCharCode(65 + idx)}.</span>
              <input className="bib-input" disabled={soloLectura} value={op} onChange={(e) => setOpcion(idx, e.target.value)} placeholder={`Opcion ${String.fromCharCode(65 + idx)}`} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div>
          <label className="bib-label">Justificacion de la respuesta correcta</label>
          <textarea className="bib-textarea" disabled={soloLectura} rows={3} value={form.justificacionCorrecta || ""} onChange={(e) => setForm({ ...form, justificacionCorrecta: e.target.value })} />
        </div>
        <div>
          <label className="bib-label">Por que los distractores son incorrectos</label>
          <textarea className="bib-textarea" disabled={soloLectura} rows={3} value={form.justificacionDistractores || ""} onChange={(e) => setForm({ ...form, justificacionDistractores: e.target.value })} />
        </div>
      </div>

      {form.historial?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <label className="bib-label">Historial</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {form.historial.map((h, idx) => (
              <div key={idx} style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                <span className="f-mono">{h.fecha}</span> - <strong>{h.autor}</strong>: {h.accion}
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
            <Save size={14} /> {guardando ? "Guardando..." : esNuevo ? "Guardar como borrador" : "Guardar cambios"}
          </button>
        </div>
      )}
    </ModalShell>
  );
}
