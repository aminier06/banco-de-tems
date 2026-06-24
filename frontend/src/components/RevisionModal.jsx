import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { AreaTag, ModalShell } from "./shared.jsx";

export default function RevisionModal({ item, onClose, onDecidir }) {
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const decidir = async (aprobar) => {
    setError("");
    setEnviando(true);
    try {
      await onDecidir(item, aprobar, comentario);
    } catch (err) {
      setError(err.message || "No se pudo registrar la decisión.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Revisar ítem" wide>
      <div className="bib-card" style={{ padding: 16, marginBottom: 16, background: "#fff" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <AreaTag id={item.area} />
          <span className="code-pill">{item.afirmacionId} · {item.evidenciaId}</span>
          <span className="code-pill">Dificultad: {item.dificultad}</span>
        </div>
        {item.contexto && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 10, whiteSpace: "pre-wrap" }}>{item.contexto}</p>}
        <p style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>{item.enunciado}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {item.opciones.map((op, idx) => (
            <div key={idx} style={{ fontSize: 13.5, display: "flex", gap: 6, color: idx === item.respuestaCorrecta ? "var(--green)" : "var(--ink)" }}>
              <span className="f-mono">{String.fromCharCode(65 + idx)}.</span> {op} {idx === item.respuestaCorrecta && <Check size={14} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--ink-soft)" }}>
          <strong>Justificación:</strong> {item.justificacionCorrecta || "(no especificada)"}
        </div>
      </div>

      <label className="bib-label">Comentario para quien elaboró el ítem (obligatorio si se rechaza)</label>
      <textarea className="bib-textarea" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ marginBottom: 12 }} />
      {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="bib-btn bib-btn-ghost" onClick={onClose} disabled={enviando}>Cancelar</button>
        <button className="bib-btn bib-btn-red" disabled={!comentario.trim() || enviando} onClick={() => decidir(false)}>
          <X size={14} /> Rechazar
        </button>
        <button className="bib-btn bib-btn-green" disabled={enviando} onClick={() => decidir(true)}>
          <Check size={14} /> Aprobar
        </button>
      </div>
    </ModalShell>
  );
}
