import React, { useState } from "react";
import { Plus, Search, Filter, ClipboardList, Pencil, Eye, Send, Trash2 } from "lucide-react";
import { AREAS, ESTADOS, ORDEN_ESTADOS } from "../lib/constants.js";
import { StampBadge, AreaTag, Banner } from "./shared.jsx";

export default function BancoItems({
  items,
  specs,
  currentUser,
  puedeEliminarItems,
  onNuevo,
  onEditar,
  onRevisar,
  onEnviar,
  onEliminar,
  puedeEditar,
  puedeEnviar,
  puedeRevisar,
  puedeCrearEn,
}) {
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [soloSinClasificar, setSoloSinClasificar] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = items.filter((i) => {
    if (filtroArea !== "todas" && i.area !== filtroArea) return false;
    if (filtroEstado !== "todos" && i.estado !== filtroEstado) return false;
    if (soloSinClasificar && i.afirmacionId) return false;
    if (busqueda && !i.enunciado.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const sinClasificarTotal = items.filter((i) => !i.afirmacionId).length;
  const areaParaNuevo = filtroArea !== "todas" ? filtroArea : currentUser.area || AREAS[0].id;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Banco de ítems</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>{filtrados.length} de {items.length} ítem(s)</p>
        </div>
        {puedeCrearEn(areaParaNuevo) && (
          <button className="bib-btn bib-btn-primary" onClick={() => onNuevo(areaParaNuevo)}>
            <Plus size={15} /> Nuevo ítem
          </button>
        )}
      </div>

      {sinClasificarTotal > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Banner tone="amber">
            Hay <strong>{sinClasificarTotal}</strong> ítem(s) sin afirmación/evidencia asignada (probablemente provenientes de una importación).{" "}
            <a onClick={() => setSoloSinClasificar(true)} style={{ color: "var(--navy)", textDecoration: "underline", cursor: "pointer" }}>
              Mostrar solo esos
            </a>
            .
          </Banner>
        </div>
      )}

      <div className="bib-card" style={{ padding: 12, display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Filter size={14} style={{ color: "var(--ink-soft)" }} />
        <select className="bib-select" style={{ width: 200 }} value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
          <option value="todas">Todas las áreas</option>
          {AREAS.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        <select className="bib-select" style={{ width: 160 }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {ORDEN_ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADOS[e].label}</option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ink-soft)" }}>
          <input type="checkbox" checked={soloSinClasificar} onChange={(e) => setSoloSinClasificar(e.target.checked)} /> Solo sin clasificar
        </label>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "var(--ink-soft)" }} />
          <input className="bib-input" style={{ paddingLeft: 30 }} placeholder="Buscar en el enunciado…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtrados.length === 0 && (
          <div className="bib-card" style={{ padding: 24, textAlign: "center", color: "var(--ink-soft)", fontSize: 13.5 }}>
            No hay ítems con estos filtros todavía.
          </div>
        )}
        {filtrados.map((item) => {
          const spec = specs[item.area];
          const competencias = Array.isArray(spec?.competencias)
            ? spec.competencias
            : Array.isArray(spec?.afirmaciones)
            ? [{ id: "principal", nombre: spec.nombre || "", afirmaciones: spec.afirmaciones }]
            : [];
          const comp = competencias.find((c) => c.id === item.competenciaId) || competencias[0];
          const af = comp?.afirmaciones?.find((a) => a.id === item.afirmacionId);
          const ev = af?.evidencias?.find((e) => e.id === item.evidenciaId);
          const tarea = ev?.tareas?.find((t) => t.id === item.tareaId);
          return (
            <div key={item.id} className="bib-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <StampBadge estado={item.estado} />
                  <AreaTag id={item.area} />
                  {item.afirmacionId ? (
                    <span className="code-pill">{item.afirmacionId} · {item.evidenciaId}{item.tareaId ? ` · ${item.tareaId}` : ""}</span>
                  ) : (
                    <span className="code-pill" style={{ background: "rgba(162,59,59,0.1)", color: "var(--red)" }}>Sin clasificar</span>
                  )}
                  <span className="code-pill">Dificultad: {item.dificultad}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Autor/a: {item.autorNombre || "—"}</div>
              </div>
              {item.imagenUrl && (
                <img src={item.imagenUrl} alt="" style={{ maxWidth: 160, maxHeight: 110, objectFit: "contain", border: "1px solid var(--rule)", borderRadius: 3, background: "#fff", marginBottom: 8 }} />
              )}
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.enunciado}</p>
              {af && (
                <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
                  {comp?.nombre ? `${comp.nombre} · ` : ""}{af.texto} {ev ? `→ ${ev.texto}` : ""} {tarea ? `→ ${tarea.texto}` : ""}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="bib-btn bib-btn-ghost" onClick={() => onEditar(item)}>
                  {puedeEditar(item) ? <Pencil size={13} /> : <Eye size={13} />} {puedeEditar(item) ? "Editar" : "Ver"}
                </button>
                {puedeEnviar(item) && (
                  <button
                    className="bib-btn bib-btn-ghost"
                    onClick={() => onEnviar(item)}
                    disabled={!item.afirmacionId}
                    title={!item.afirmacionId ? "Asigna afirmación y evidencia antes de enviar a revisión" : ""}
                  >
                    <Send size={13} /> Enviar a revisión
                  </button>
                )}
                {puedeRevisar(item) && (
                  <button className="bib-btn bib-btn-primary" onClick={() => onRevisar(item)}>
                    <ClipboardList size={13} /> Revisar
                  </button>
                )}
                {puedeEliminarItems && (
                  <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => { if (confirm("¿Eliminar este ítem del banco?")) onEliminar(item); }}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
