import React from "react";
import { ModalShell } from "./shared.jsx";

export default function TestPreviewModal({ test, items, onClose }) {
  const seleccionados = test.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean);
  const grupos = [];
  const vistos = new Set();
  seleccionados.forEach((it) => {
    if (it.contexto && vistos.has(it.contexto)) {
      grupos.find((g) => g.contexto === it.contexto).items.push(it);
    } else {
      if (it.contexto) vistos.add(it.contexto);
      grupos.push({ contexto: it.contexto || null, items: [it] });
    }
  });

  let n = 0;
  return (
    <ModalShell onClose={onClose} title={`Cuadernillo — ${test.nombre}`} wide>
      <div style={{ marginBottom: 16, fontSize: 12.5, color: "var(--ink-soft)" }}>
        {test.grado} · {test.convocatoria} · {seleccionados.length} ítems
      </div>
      <div className="bib-card" style={{ padding: 22, background: "#fff" }}>
        {grupos.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 22 }}>
            {g.contexto && <p style={{ fontSize: 13, color: "var(--ink-soft)", whiteSpace: "pre-wrap", marginBottom: 12, borderLeft: "3px solid var(--rule)", paddingLeft: 10 }}>{g.contexto}</p>}
            {g.items.map((it) => {
              n++;
              return (
                <div key={it.id} style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    <span className="f-mono">{n}.</span> {it.enunciado}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 18 }}>
                    {it.opciones.map((op, idx) => (
                      <div key={idx} style={{ fontSize: 13 }}>
                        <span className="f-mono">{String.fromCharCode(65 + idx)}.</span> {op}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
