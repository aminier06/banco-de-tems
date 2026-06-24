import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { AREAS } from "../lib/constants.js";
import { Banner } from "./shared.jsx";

// Un area puede tener varias competencias (ej. en Lengua: "Comprension lectora"
// y "Produccion de textos"). Cada competencia tiene su propio arbol completo
// Afirmacion -> Evidencia -> Tarea.

function migrarSpec(spec) {
  if (!spec) return { competencias: [] };
  if (Array.isArray(spec.competencias)) return { competencias: spec.competencias };
  // Compatibilidad con la forma anterior (un area = una sola tabla de afirmaciones).
  if (Array.isArray(spec.afirmaciones)) {
    return {
      competencias: [
        { id: "principal", nombre: spec.nombre || "", afirmaciones: spec.afirmaciones, tiposTexto: spec.tiposTexto || [] },
      ],
    };
  }
  return { competencias: [] };
}

function conCompetencia(draft, compId, fn) {
  return { ...draft, competencias: draft.competencias.map((c) => (c.id === compId ? fn(c) : c)) };
}

// Aplana la jerarquia Afirmacion -> Evidencia -> Tarea en filas de tabla,
// calculando cuantas filas debe abarcar (rowSpan) cada celda combinada.
function construirFilas(afirmaciones) {
  const filas = [];
  afirmaciones.forEach((af) => {
    const evidencias = af.evidencias && af.evidencias.length > 0 ? af.evidencias : [null];
    const afRowSpan = evidencias.reduce((acc, ev) => {
      const tareas = ev && ev.tareas && ev.tareas.length > 0 ? ev.tareas : [null];
      return acc + tareas.length;
    }, 0);
    let afRendido = false;
    evidencias.forEach((ev) => {
      const tareas = ev && ev.tareas && ev.tareas.length > 0 ? ev.tareas : [null];
      let evRendido = false;
      tareas.forEach((t) => {
        filas.push({ af, mostrarAf: !afRendido, afRowSpan, ev, mostrarEv: !evRendido, evRowSpan: tareas.length, t });
        afRendido = true;
        evRendido = true;
      });
    });
  });
  return filas;
}

const thStyle = {
  background: "var(--navy)",
  color: "#fff",
  fontFamily: "'PT Serif', serif",
  fontWeight: 700,
  fontSize: 13,
  padding: "8px 10px",
  border: "1px solid var(--navy)",
  textAlign: "center",
};
const tdStyle = {
  border: "1px solid var(--rule)",
  padding: "8px",
  verticalAlign: "top",
  background: "#fff",
};

function TablaCompetencia({ comp, puedeEditar, onChange, onDelete }) {
  const afirmaciones = comp.afirmaciones || [];
  const totalAfirmaciones = afirmaciones.reduce((s, a) => s + Number(a.peso || 0), 0);
  const filas = construirFilas(afirmaciones);

  const actualizarAfirmacion = (id, patch) => {
    onChange({ ...comp, afirmaciones: afirmaciones.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  };
  const actualizarEvidencia = (afId, evId, patch) => {
    onChange({
      ...comp,
      afirmaciones: afirmaciones.map((a) =>
        a.id === afId ? { ...a, evidencias: (a.evidencias || []).map((ev) => (ev.id === evId ? { ...ev, ...patch } : ev)) } : a
      ),
    });
  };
  const actualizarTarea = (afId, evId, tareaId, patch) => {
    onChange({
      ...comp,
      afirmaciones: afirmaciones.map((a) =>
        a.id !== afId
          ? a
          : {
              ...a,
              evidencias: (a.evidencias || []).map((ev) =>
                ev.id !== evId ? ev : { ...ev, tareas: (ev.tareas || []).map((t) => (t.id === tareaId ? { ...t, ...patch } : t)) }
              ),
            }
      ),
    });
  };
  const agregarAfirmacion = () => {
    const n = afirmaciones.length + 1;
    onChange({ ...comp, afirmaciones: [...afirmaciones, { id: `A${n}`, texto: "Nueva afirmacion", peso: 0, evidencias: [] }] });
  };
  const eliminarAfirmacion = (id) => onChange({ ...comp, afirmaciones: afirmaciones.filter((a) => a.id !== id) });
  const agregarEvidencia = (afId) => {
    onChange({
      ...comp,
      afirmaciones: afirmaciones.map((a) =>
        a.id === afId
          ? { ...a, evidencias: [...(a.evidencias || []), { id: `${afId}.${(a.evidencias || []).length + 1}`, texto: "Nueva evidencia", peso: 0, tareas: [] }] }
          : a
      ),
    });
  };
  const eliminarEvidencia = (afId, evId) => {
    onChange({
      ...comp,
      afirmaciones: afirmaciones.map((a) => (a.id === afId ? { ...a, evidencias: (a.evidencias || []).filter((ev) => ev.id !== evId) } : a)),
    });
  };
  const agregarTarea = (afId, evId) => {
    onChange({
      ...comp,
      afirmaciones: afirmaciones.map((a) =>
        a.id !== afId
          ? a
          : {
              ...a,
              evidencias: (a.evidencias || []).map((ev) =>
                ev.id !== evId
                  ? ev
                  : { ...ev, tareas: [...(ev.tareas || []), { id: `${evId}.${(ev.tareas || []).length + 1}`, texto: "Nueva tarea", peso: 0 }] }
              ),
            }
      ),
    });
  };
  const eliminarTarea = (afId, evId, tareaId) => {
    onChange({
      ...comp,
      afirmaciones: afirmaciones.map((a) =>
        a.id !== afId
          ? a
          : {
              ...a,
              evidencias: (a.evidencias || []).map((ev) =>
                ev.id !== evId ? ev : { ...ev, tareas: (ev.tareas || []).filter((t) => t.id !== tareaId) }
              ),
            }
      ),
    });
  };

  return (
    <div className="bib-card" style={{ padding: 14, marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <label className="bib-label" style={{ margin: 0 }}>Competencia:</label>
        <input
          className="bib-input"
          disabled={!puedeEditar}
          value={comp.nombre || ""}
          placeholder="Nombre de esta competencia (ej. Comprension lectora)"
          onChange={(e) => onChange({ ...comp, nombre: e.target.value })}
          style={{ flex: 1, fontFamily: "'PT Serif', serif", fontWeight: 700 }}
        />
        {puedeEditar && (
          <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={onDelete}>
            <Trash2 size={13} /> Eliminar competencia
          </button>
        )}
      </div>

      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="code-pill">Suma de pesos por afirmacion: {totalAfirmaciones}%</span>
        {totalAfirmaciones !== 100 && afirmaciones.length > 0 && <span style={{ color: "var(--red)", fontSize: 12 }}>Debe sumar 100%.</span>}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--navy)", borderRadius: 3 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "31%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Afirmacion</th>
              <th style={thStyle}>% de preguntas por afirmacion</th>
              <th style={thStyle}>Evidencia</th>
              <th style={thStyle}>% de preguntas por evidencia</th>
              <th style={thStyle}>Tarea</th>
              <th style={thStyle}>% de preguntas por tarea</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--ink-soft)", padding: 20 }}>
                  Esta competencia aun no tiene afirmaciones configuradas.
                </td>
              </tr>
            )}
            {filas.map((fila, idx) => {
              const evidencias = fila.af.evidencias || [];
              const sumaEv = evidencias.reduce((s, e) => s + Number(e.peso || 0), 0);
              const tareasEv = fila.ev ? fila.ev.tareas || [] : [];
              const sumaTareas = tareasEv.reduce((s, t) => s + Number(t.peso || 0), 0);
              return (
                <tr key={idx}>
                  {fila.mostrarAf && (
                    <td style={tdStyle} rowSpan={fila.afRowSpan}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                        <span className="code-pill">{fila.af.id}</span>
                        {puedeEditar && (
                          <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)", padding: "3px 6px" }} onClick={() => eliminarAfirmacion(fila.af.id)}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <textarea
                        className="bib-textarea"
                        disabled={!puedeEditar}
                        rows={3}
                        value={fila.af.texto}
                        onChange={(e) => actualizarAfirmacion(fila.af.id, { texto: e.target.value })}
                        style={{ marginBottom: 6, resize: "vertical" }}
                      />
                      {sumaEv !== Number(fila.af.peso) && evidencias.length > 0 && (
                        <div style={{ fontSize: 10.5, color: "var(--red)", marginBottom: 4 }}>Evidencias suman {sumaEv}%.</div>
                      )}
                      {puedeEditar && (
                        <button className="bib-btn bib-btn-ghost" style={{ fontSize: 11 }} onClick={() => agregarEvidencia(fila.af.id)}>
                          <Plus size={10} /> Evidencia
                        </button>
                      )}
                    </td>
                  )}
                  {fila.mostrarAf && (
                    <td style={{ ...tdStyle, textAlign: "center" }} rowSpan={fila.afRowSpan}>
                      <input
                        className="bib-input"
                        type="number"
                        disabled={!puedeEditar}
                        value={fila.af.peso}
                        onChange={(e) => actualizarAfirmacion(fila.af.id, { peso: Number(e.target.value) })}
                        style={{ textAlign: "center" }}
                      />
                    </td>
                  )}

                  {fila.ev ? (
                    <>
                      {fila.mostrarEv && (
                        <td style={tdStyle} rowSpan={fila.evRowSpan}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                            <span className="code-pill">{fila.ev.id}</span>
                            {puedeEditar && (
                              <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)", padding: "3px 6px" }} onClick={() => eliminarEvidencia(fila.af.id, fila.ev.id)}>
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <textarea
                            className="bib-textarea"
                            disabled={!puedeEditar}
                            rows={3}
                            value={fila.ev.texto}
                            onChange={(e) => actualizarEvidencia(fila.af.id, fila.ev.id, { texto: e.target.value })}
                            style={{ marginBottom: 6, resize: "vertical" }}
                          />
                          {sumaTareas !== Number(fila.ev.peso) && tareasEv.length > 0 && (
                            <div style={{ fontSize: 10.5, color: "var(--red)", marginBottom: 4 }}>Tareas suman {sumaTareas}%.</div>
                          )}
                          {puedeEditar && (
                            <button className="bib-btn bib-btn-ghost" style={{ fontSize: 11 }} onClick={() => agregarTarea(fila.af.id, fila.ev.id)}>
                              <Plus size={10} /> Tarea
                            </button>
                          )}
                        </td>
                      )}
                      {fila.mostrarEv && (
                        <td style={{ ...tdStyle, textAlign: "center" }} rowSpan={fila.evRowSpan}>
                          <input
                            className="bib-input"
                            type="number"
                            disabled={!puedeEditar}
                            value={fila.ev.peso}
                            onChange={(e) => actualizarEvidencia(fila.af.id, fila.ev.id, { peso: Number(e.target.value) })}
                            style={{ textAlign: "center" }}
                          />
                        </td>
                      )}
                    </>
                  ) : (
                    <td style={{ ...tdStyle, textAlign: "center", color: "var(--ink-soft)", fontSize: 12 }} colSpan={2}>
                      Sin evidencias todavia.
                    </td>
                  )}

                  {fila.t ? (
                    <>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                          <span className="code-pill" style={{ background: "rgba(63,107,79,0.1)", color: "var(--green)" }}>{fila.t.id}</span>
                          {puedeEditar && (
                            <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)", padding: "3px 6px" }} onClick={() => eliminarTarea(fila.af.id, fila.ev.id, fila.t.id)}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <textarea
                          className="bib-textarea"
                          disabled={!puedeEditar}
                          rows={2}
                          value={fila.t.texto}
                          onChange={(e) => actualizarTarea(fila.af.id, fila.ev.id, fila.t.id, { texto: e.target.value })}
                          style={{ resize: "vertical" }}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <input
                          className="bib-input"
                          type="number"
                          disabled={!puedeEditar}
                          value={fila.t.peso}
                          onChange={(e) => actualizarTarea(fila.af.id, fila.ev.id, fila.t.id, { peso: Number(e.target.value) })}
                          style={{ textAlign: "center" }}
                        />
                      </td>
                    </>
                  ) : (
                    <td style={{ ...tdStyle, textAlign: "center", color: "var(--ink-soft)", fontSize: 12 }} colSpan={2}>
                      {fila.ev ? "Sin tareas todavia." : ""}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {puedeEditar && (
        <button className="bib-btn bib-btn-ghost" style={{ marginTop: 10 }} onClick={agregarAfirmacion}>
          <Plus size={13} /> Anadir afirmacion
        </button>
      )}
    </div>
  );
}

export default function SpecsEditor({ specs, puedeEditar, onSave }) {
  const [areaId, setAreaId] = useState("lengua");
  const [draft, setDraft] = useState(migrarSpec(specs[areaId]));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(migrarSpec(specs[areaId]));
    setError("");
  }, [areaId, specs]);

  const competencias = draft.competencias || [];

  const agregarCompetencia = () => {
    const id = `comp-${Date.now()}`;
    setDraft({ ...draft, competencias: [...competencias, { id, nombre: "", afirmaciones: [], tiposTexto: [] }] });
  };
  const eliminarCompetencia = (compId) => {
    setDraft({ ...draft, competencias: competencias.filter((c) => c.id !== compId) });
  };
  const actualizarCompetencia = (compId, nuevaComp) => {
    setDraft(conCompetencia(draft, compId, () => nuevaComp));
  };

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      await onSave(areaId, { competencias });
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
        {"Cada area puede tener una o varias competencias. Dominio del area > Competencia > Afirmacion > Evidencia > Tarea. De la Tarea surgen los items del banco."}
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {AREAS.map((a) => (
          <button key={a.id} className={`bib-btn ${areaId === a.id ? "bib-btn-primary" : "bib-btn-ghost"}`} onClick={() => setAreaId(a.id)}>
            {a.nombre}
          </button>
        ))}
      </div>

      {!puedeEditar && <Banner tone="amber">Solo el equipo tecnico de evaluacion y el administrador pueden editar las especificaciones. Puedes consultarlas en modo lectura.</Banner>}

      {competencias.length === 0 && (
        <div className="bib-card" style={{ padding: 20, textAlign: "center", color: "var(--ink-soft)", marginTop: 14 }}>
          Esta area todavia no tiene ninguna competencia configurada.
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {competencias.map((comp) => (
          <TablaCompetencia
            key={comp.id}
            comp={comp}
            puedeEditar={puedeEditar}
            onChange={(nuevaComp) => actualizarCompetencia(comp.id, nuevaComp)}
            onDelete={() => eliminarCompetencia(comp.id)}
          />
        ))}
      </div>

      {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

      {puedeEditar && (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bib-btn bib-btn-ghost" onClick={agregarCompetencia}>
            <Plus size={14} /> Anadir competencia
          </button>
          <button className="bib-btn bib-btn-primary" disabled={guardando} onClick={guardar}>
            <Save size={14} /> {guardando ? "Guardando..." : "Guardar especificaciones"}
          </button>
        </div>
      )}
    </div>
  );
}
