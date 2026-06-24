import React, { useState, useMemo } from "react";
import { Save, Eye, Trash2 } from "lucide-react";
import { AREAS, areaInfo } from "../lib/constants.js";
import { AreaTag, Banner } from "./shared.jsx";

function targetCount(peso, total) {
  return Math.round((peso / 100) * total);
}

export default function ArmarPrueba({ items, specs, tests, puedeEliminarPrueba, onSaveTest, onDeleteTest, onPreview }) {
  const [areaId, setAreaId] = useState("lengua");
  const [competenciaId, setCompetenciaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("6to de Secundaria");
  const [convocatoria, setConvocatoria] = useState("Primera convocatoria");
  const [totalItems, setTotalItems] = useState(20);
  const [seleccionados, setSeleccionados] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const spec = specs[areaId];
  // Compatibilidad: si el area todavia no migro a la forma con "competencias",
  // se trata su unica tabla de afirmaciones como una competencia "principal".
  const competencias = Array.isArray(spec?.competencias)
    ? spec.competencias
    : Array.isArray(spec?.afirmaciones)
    ? [{ id: "principal", nombre: spec.nombre || "", afirmaciones: spec.afirmaciones }]
    : [];
  const compIdActual = competenciaId || (competencias.length === 1 ? competencias[0].id : "");
  const comp = competencias.find((c) => c.id === compIdActual);
  const afirmaciones = comp?.afirmaciones || [];

  const aprobados = items.filter((i) => i.area === areaId && i.estado === "aprobado" && (!comp || i.competenciaId === comp.id));

  const toggleItem = (id) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const conteoPorEvidencia = useMemo(() => {
    const map = {};
    seleccionados.forEach((id) => {
      const it = items.find((i) => i.id === id);
      if (it) map[it.evidenciaId] = (map[it.evidenciaId] || 0) + 1;
    });
    return map;
  }, [seleccionados, items]);

  const distribucion = useMemo(() => {
    if (afirmaciones.length === 0) return [];
    return afirmaciones.map((af) => {
      const targetAf = targetCount(af.peso, totalItems);
      const evidencias = (af.evidencias || []).map((ev) => ({ ...ev, target: targetCount(ev.peso, totalItems), actual: conteoPorEvidencia[ev.id] || 0 }));
      const actualAf = evidencias.reduce((s, e) => s + e.actual, 0);
      return { ...af, target: targetAf, actual: actualAf, evidencias };
    });
  }, [afirmaciones, totalItems, conteoPorEvidencia]);

  const totalSeleccionado = seleccionados.length;
  const cumpleTotal = totalSeleccionado === Number(totalItems);
  const desalineados = distribucion.filter((d) => d.actual !== d.target);

  const cambiarArea = (nuevaArea) => {
    setAreaId(nuevaArea);
    setCompetenciaId("");
    setSeleccionados([]);
  };

  const cambiarCompetencia = (nuevaCompId) => {
    setCompetenciaId(nuevaCompId);
    setSeleccionados([]);
  };

  const guardarPrueba = async () => {
    setError("");
    setGuardando(true);
    try {
      await onSaveTest({
        nombre: nombre || `Prueba de ${comp?.nombre || areaInfo(areaId).nombre}`,
        area: areaId,
        grado,
        convocatoria,
        totalItems: Number(totalItems),
        itemIds: seleccionados,
      });
      setNombre("");
      setSeleccionados([]);
    } catch (err) {
      setError(err.message || "No se pudo guardar la prueba.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Armar prueba</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>
        Selecciona items aprobados del banco respetando la distribucion de la tabla de especificaciones.
      </p>

      <div className="bib-card" style={{ padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr", gap: 10 }}>
        <div>
          <label className="bib-label">Nombre de la prueba</label>
          <input className="bib-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={`Prueba de ${comp?.nombre || areaInfo(areaId).nombre}`} />
        </div>
        <div>
          <label className="bib-label">Area</label>
          <select className="bib-select" value={areaId} onChange={(e) => cambiarArea(e.target.value)}>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="bib-label">Convocatoria</label>
          <select className="bib-select" value={convocatoria} onChange={(e) => setConvocatoria(e.target.value)}>
            <option>Primera convocatoria</option>
            <option>Segunda convocatoria</option>
            <option>Tercera convocatoria</option>
          </select>
        </div>
        <div>
          <label className="bib-label">Total de items</label>
          <input className="bib-input" type="number" min={1} value={totalItems} onChange={(e) => setTotalItems(Number(e.target.value))} />
        </div>
      </div>

      <div className="bib-card" style={{ padding: 14, marginBottom: 16 }}>
        <label className="bib-label">Competencia</label>
        {competencias.length === 0 ? (
          <Banner tone="amber">Esta area no tiene ninguna competencia configurada todavia. Ve a la pestana "Especificaciones" para crear una.</Banner>
        ) : (
          <select className="bib-select" value={compIdActual} onChange={(e) => cambiarCompetencia(e.target.value)}>
            <option value="">Selecciona...</option>
            {competencias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre || c.id}</option>
            ))}
          </select>
        )}
      </div>

      {!comp || afirmaciones.length === 0 ? (
        <Banner tone="amber">Selecciona una competencia con afirmaciones y evidencias configuradas para poder armar la prueba.</Banner>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 16 }}>
          <div>
            <div className="bib-card" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span className="f-display" style={{ fontSize: 14 }}>Distribucion objetivo</span>
                <span className="code-pill">{totalSeleccionado} / {totalItems} seleccionados</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {distribucion.map((af) => (
                  <div key={af.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                      <span><strong>{af.id}</strong> {af.texto}</span>
                      <span style={{ color: af.actual === af.target ? "var(--green)" : "var(--amber)", fontWeight: 600 }}>{af.actual} / {af.target}</span>
                    </div>
                    <div className="bib-progress">
                      <div style={{ width: `${Math.min(100, (af.actual / Math.max(1, af.target)) * 100)}%`, background: af.actual === af.target ? "var(--green)" : af.actual > af.target ? "var(--red)" : "var(--amber)" }} />
                    </div>
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                      {af.evidencias.map((ev) => (
                        <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", paddingLeft: 10 }}>
                          <span>{ev.id} {ev.texto}</span>
                          <span style={{ color: ev.actual === ev.target ? "var(--green)" : "inherit" }}>{ev.actual}/{ev.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {cumpleTotal && desalineados.length === 0 ? (
              <Banner tone="green">La seleccion cumple la distribucion objetivo de la tabla de especificaciones.</Banner>
            ) : (
              <Banner tone="amber">
                {!cumpleTotal && <>Faltan o sobran items para llegar a {totalItems} en total. </>}
                {desalineados.length > 0 && <>Hay {desalineados.length} afirmacion(es) sin la proporcion exacta.</>}
              </Banner>
            )}

            {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 10 }}>{error}</div>}

            <button className="bib-btn bib-btn-primary" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} disabled={seleccionados.length === 0 || guardando} onClick={guardarPrueba}>
              <Save size={14} /> {guardando ? "Guardando..." : `Guardar prueba (${seleccionados.length} items)`}
            </button>
          </div>

          <div>
            <div className="bib-card bib-scroll" style={{ padding: 14, maxHeight: 520, overflowY: "auto" }}>
              {aprobados.length === 0 && (
                <div style={{ color: "var(--ink-soft)", fontSize: 13, textAlign: "center", padding: 20 }}>Todavia no hay items aprobados en esta competencia.</div>
              )}
              {afirmaciones.map((af) => (
                <div key={af.id} style={{ marginBottom: 14 }}>
                  <div className="f-display" style={{ fontSize: 13, color: "var(--navy)", marginBottom: 6 }}>{af.id} - {af.texto}</div>
                  {(af.evidencias || []).map((ev) => {
                    const itemsEv = aprobados.filter((i) => i.evidenciaId === ev.id);
                    if (itemsEv.length === 0) return null;
                    return (
                      <div key={ev.id} style={{ marginBottom: 8, paddingLeft: 10 }}>
                        <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 4 }}>{ev.id} {ev.texto}</div>
                        {itemsEv.map((it) => (
                          <label key={it.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 6px", borderRadius: 3, cursor: "pointer", background: seleccionados.includes(it.id) ? "rgba(28,49,68,0.06)" : "transparent" }}>
                            <input type="checkbox" checked={seleccionados.includes(it.id)} onChange={() => toggleItem(it.id)} style={{ marginTop: 3 }} />
                            <span style={{ fontSize: 12.5 }}>{it.enunciado} <span className="code-pill" style={{ marginLeft: 4 }}>{it.dificultad}</span></span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tests.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 className="f-display" style={{ fontSize: 16, marginBottom: 10 }}>Pruebas armadas</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tests.map((t) => (
              <div key={t.id} className="bib-card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.nombre}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                    <AreaTag id={t.area} /> - {t.grado} - {t.convocatoria} - {t.itemIds.length} items - {t.createdAt?.slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bib-btn bib-btn-ghost" onClick={() => onPreview(t)}>
                    <Eye size={13} /> Vista previa
                  </button>
                  {puedeEliminarPrueba && (
                    <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => { if (confirm("Eliminar esta prueba armada?")) onDeleteTest(t.id); }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
