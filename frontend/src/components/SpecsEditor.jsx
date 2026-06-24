import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { AREAS } from "../lib/constants.js";
import { Banner } from "./shared.jsx";

export default function SpecsEditor({ specs, puedeEditar, onSave }) {
  const [areaId, setAreaId] = useState("lengua");
  const [draft, setDraft] = useState(specs[areaId] || { afirmaciones: [], tiposTexto: [] });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(specs[areaId] || { afirmaciones: [], tiposTexto: [] });
    setError("");
  }, [areaId, specs]);

  const totalAfirmaciones = draft.afirmaciones.reduce((s, a) => s + Number(a.peso || 0), 0);

  const actualizarAfirmacion = (id, patch) => {
    setDraft({ ...draft, afirmaciones: draft.afirmaciones.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  };
  const actualizarEvidencia = (afId, evId, patch) => {
    setDraft({
      ...draft,
      afirmaciones: draft.afirmaciones.map((a) =>
        a.id === afId ? { ...a, evidencias: a.evidencias.map((ev) => (ev.id === evId ? { ...ev, ...patch } : ev)) } : a
      ),
    });
  };
  const agregarAfirmacion = () => {
    const n = draft.afirmaciones.length + 1;
    setDraft({ ...draft, afirmaciones: [...draft.afirmaciones, { id: `A${n}`, texto: "Nueva afirmación", peso: 0, evidencias: [] }] });
  };
  const eliminarAfirmacion = (id) => setDraft({ ...draft, afirmaciones: draft.afirmaciones.filter((a) => a.id !== id) });
  const agregarEvidencia = (afId) => {
    setDraft({
      ...draft,
      afirmaciones: draft.afirmaciones.map((a) =>
        a.id === afId ? { ...a, evidencias: [...a.evidencias, { id: `${afId}.${a.evidencias.length + 1}`, texto: "Nueva evidencia", peso: 0 }] } : a
      ),
    });
  };
  const eliminarEvidencia = (afId, evId) => {
    setDraft({
      ...draft,
      afirmaciones: draft.afirmaciones.map((a) => (a.id === afId ? { ...a, evidencias: a.evidencias.filter((ev) => ev.id !== evId) } : a)),
    });
  };

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      await onSave(areaId, { nombre: draft.nombre, afirmaciones: draft.afirmaciones, tiposTexto: draft.tiposTexto || [] });
    } catch (err) {
      setError(err.message || "No se pudieron guardar las especificaciones.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Especificaciones de la prueba</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>
        Tabla de afirmaciones, evidencias y pesos por área (diseño centrado en evidencias).
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {AREAS.map((a) => (
          <button key={a.id} className={`bib-btn ${areaId === a.id ? "bib-btn-primary" : "bib-btn-ghost"}`} onClick={() => setAreaId(a.id)}>
            {a.nombre}
          </button>
        ))}
      </div>

      {!puedeEditar && <Banner tone="amber">Solo el equipo técnico de evaluación y el administrador pueden editar las especificaciones. Puedes consultarlas en modo lectura.</Banner>}

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span className="code-pill">Suma de pesos por afirmación: {totalAfirmaciones}%</span>
        {totalAfirmaciones !== 100 && draft.afirmaciones.length > 0 && <span style={{ color: "var(--red)", fontSize: 12 }}>Debe sumar 100%.</span>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {draft.afirmaciones.map((af) => {
          const sumaEv = af.evidencias.reduce((s, e) => s + Number(e.peso || 0), 0);
          return (
            <div key={af.id} className="bib-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                <span className="code-pill" style={{ marginTop: 8 }}>{af.id}</span>
                <input className="bib-input" disabled={!puedeEditar} value={af.texto} onChange={(e) => actualizarAfirmacion(af.id, { texto: e.target.value })} style={{ flex: 1 }} />
                <input className="bib-input" disabled={!puedeEditar} type="number" value={af.peso} onChange={(e) => actualizarAfirmacion(af.id, { peso: Number(e.target.value) })} style={{ width: 80 }} />
                <span style={{ paddingTop: 8, fontSize: 13 }}>%</span>
                {puedeEditar && (
                  <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => eliminarAfirmacion(af.id)}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
                {af.evidencias.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="code-pill">{ev.id}</span>
                    <input className="bib-input" disabled={!puedeEditar} value={ev.texto} onChange={(e) => actualizarEvidencia(af.id, ev.id, { texto: e.target.value })} style={{ flex: 1 }} />
                    <input className="bib-input" disabled={!puedeEditar} type="number" value={ev.peso} onChange={(e) => actualizarEvidencia(af.id, ev.id, { peso: Number(e.target.value) })} style={{ width: 70 }} />
                    <span style={{ fontSize: 13 }}>%</span>
                    {puedeEditar && (
                      <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => eliminarEvidencia(af.id, ev.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {puedeEditar && (
                  <button className="bib-btn bib-btn-ghost" style={{ alignSelf: "flex-start", fontSize: 12 }} onClick={() => agregarEvidencia(af.id)}>
                    <Plus size={12} /> Añadir evidencia
                  </button>
                )}
                {af.evidencias.length > 0 && sumaEv !== Number(af.peso) && (
                  <div style={{ fontSize: 11.5, color: "var(--red)" }}>Las evidencias suman {sumaEv}%, deberían sumar {af.peso}%.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 10 }}>{error}</div>}

      {puedeEditar && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="bib-btn bib-btn-ghost" onClick={agregarAfirmacion}>
            <Plus size={14} /> Añadir afirmación
          </button>
          <button className="bib-btn bib-btn-primary" disabled={guardando} onClick={guardar}>
            <Save size={14} /> {guardando ? "Guardando…" : "Guardar especificaciones"}
          </button>
        </div>
      )}
    </div>
  );
}
