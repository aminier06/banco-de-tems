import React, { useMemo } from "react";
import { AREAS, ESTADOS, ORDEN_ESTADOS } from "../lib/constants.js";
import { Banner } from "./shared.jsx";

export default function Dashboard({ items, tests, puedeRevisar, onGoBanco }) {
  const porAreaEstado = useMemo(() => {
    const map = {};
    AREAS.forEach((a) => {
      map[a.id] = { borrador: 0, en_revision: 0, aprobado: 0, rechazado: 0 };
    });
    items.forEach((i) => {
      if (map[i.area]) map[i.area][i.estado]++;
    });
    return map;
  }, [items]);

  const pendientes = items.filter((i) => i.estado === "en_revision");
  const totalAprobados = items.filter((i) => i.estado === "aprobado").length;

  const maxTotal = Math.max(1, ...AREAS.map((a) => Object.values(porAreaEstado[a.id]).reduce((s, n) => s + n, 0)));

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Panel general</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 20 }}>
        Resumen del estado del banco de ítems para las Pruebas Nacionales del Segundo Ciclo de Secundaria.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        <StatCard label="Ítems totales" value={items.length} />
        <StatCard label="Aprobados" value={totalAprobados} color="var(--green)" />
        <StatCard label="En revisión" value={pendientes.length} color="var(--amber)" />
        <StatCard label="Pruebas armadas" value={tests.length} color="var(--navy)" />
      </div>

      <div className="bib-card" style={{ padding: 18, marginBottom: 20 }}>
        <h2 className="f-display" style={{ fontSize: 15, marginBottom: 14 }}>Ítems por área y estado</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {AREAS.map((a) => {
            const counts = porAreaEstado[a.id];
            const total = Object.values(counts).reduce((s, n) => s + n, 0);
            return (
              <div key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{a.nombre}</span>
                  <span style={{ color: "var(--ink-soft)" }}>{total} ítem(s)</span>
                </div>
                <div style={{ display: "flex", height: 10, borderRadius: 3, overflow: "hidden", border: "1px solid var(--rule)" }}>
                  {ORDEN_ESTADOS.map((e) => {
                    const w = total ? (counts[e] / maxTotal) * 100 : 0;
                    return counts[e] ? (
                      <div key={e} title={`${ESTADOS[e].label}: ${counts[e]}`} style={{ width: `${w}%`, background: ESTADOS[e].color }} />
                    ) : null;
                  })}
                  {total === 0 && <div style={{ width: "100%", background: "var(--rule)" }} />}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          {ORDEN_ESTADOS.map((e) => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-soft)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: ESTADOS[e].color, display: "inline-block" }} />
              {ESTADOS[e].label}
            </div>
          ))}
        </div>
      </div>

      {puedeRevisar && pendientes.length > 0 && (
        <Banner tone="amber">
          Hay <strong>{pendientes.length}</strong> ítem(s) esperando revisión.{" "}
          <a onClick={onGoBanco} style={{ color: "var(--navy)", textDecoration: "underline", cursor: "pointer" }}>
            Ir al banco de ítems
          </a>
          .
        </Banner>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "var(--ink)" }) {
  return (
    <div className="bib-card" style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", marginBottom: 6 }}>{label}</div>
      <div className="f-display" style={{ fontSize: 26, color }}>{value}</div>
    </div>
  );
}
