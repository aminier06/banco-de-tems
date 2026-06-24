import React from "react";
import { Stamp as StampIcon, AlertTriangle, X } from "lucide-react";
import { ESTADOS, areaInfo } from "../lib/constants.js";

export function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      .bib-root {
        --paper: #EEEBE1;
        --paper-raised: #F7F5EE;
        --ink: #21241F;
        --ink-soft: #5B5A52;
        --navy: #1C3144;
        --navy-soft: #364A5C;
        --rule: #D8D3C4;
        --green: #3F6B4F;
        --red: #A23B3B;
        --amber: #B8862B;
        --grey: #8A8579;
        font-family: 'Inter', sans-serif;
        color: var(--ink);
        background: var(--paper);
      }
      .bib-root .f-display { font-family: 'PT Serif', serif; }
      .bib-root .f-mono { font-family: 'IBM Plex Mono', monospace; }
      .bib-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .bib-scroll::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 4px; }
      .bib-card { background: var(--paper-raised); border: 1px solid var(--rule); border-radius: 3px; }
      .bib-btn {
        font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 0.01em;
        border-radius: 3px; padding: 7px 13px; display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid transparent; cursor: pointer; transition: filter 0.12s ease, transform 0.05s ease;
      }
      .bib-btn:active { transform: translateY(1px); }
      .bib-btn-primary { background: var(--navy); color: #fff; }
      .bib-btn-primary:hover { filter: brightness(1.12); }
      .bib-btn-ghost { background: transparent; color: var(--ink); border-color: var(--rule); }
      .bib-btn-ghost:hover { background: rgba(0,0,0,0.04); }
      .bib-btn-green { background: var(--green); color: #fff; }
      .bib-btn-green:hover { filter: brightness(1.12); }
      .bib-btn-red { background: var(--red); color: #fff; }
      .bib-btn-red:hover { filter: brightness(1.12); }
      .bib-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .bib-input, .bib-select, .bib-textarea {
        font-family: 'Inter', sans-serif; border: 1px solid var(--rule); background: #fff; border-radius: 3px;
        padding: 7px 9px; font-size: 13.5px; color: var(--ink); width: 100%;
      }
      .bib-input:focus, .bib-select:focus, .bib-textarea:focus { outline: 2px solid var(--navy-soft); outline-offset: 1px; }
      .bib-label {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-soft);
        font-weight: 600; margin-bottom: 4px; display: block;
      }
      .stamp {
        font-family: 'PT Serif', serif; font-weight: 700; text-transform: uppercase; font-size: 10.5px;
        letter-spacing: 0.09em; display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px 3px 7px; border: 1.5px solid currentColor; border-radius: 2px;
        transform: rotate(-2deg); position: relative; white-space: nowrap;
      }
      .stamp::after { content: ''; position: absolute; inset: 2px; border: 1px solid currentColor; opacity: 0.45; border-radius: 1px; }
      .code-pill {
        font-family: 'IBM Plex Mono', monospace; font-size: 11px; background: rgba(28,49,68,0.07);
        color: var(--navy); padding: 2px 6px; border-radius: 3px; white-space: nowrap;
      }
      .navlink {
        display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 3px; font-size: 13.5px;
        font-weight: 500; color: rgba(255,255,255,0.78); cursor: pointer; border-left: 3px solid transparent;
      }
      .navlink:hover { background: rgba(255,255,255,0.06); }
      .navlink.active { background: rgba(255,255,255,0.1); color: #fff; border-left-color: #C99A3E; }
      .bib-progress { height: 6px; border-radius: 3px; background: var(--rule); overflow: hidden; }
      .bib-progress > div { height: 100%; }
    `}</style>
  );
}

export function StampBadge({ estado }) {
  const e = ESTADOS[estado];
  return (
    <span className="stamp" style={{ color: e.color }}>
      <StampIcon size={11} /> {e.label}
    </span>
  );
}

export function AreaTag({ id }) {
  const a = areaInfo(id);
  if (!a) return null;
  return (
    <span className="code-pill" style={{ background: `${a.color}14`, color: a.color }}>
      {a.abrev} · {a.nombre}
    </span>
  );
}

export function Banner({ tone = "amber", children }) {
  const colors = { amber: "var(--amber)", green: "var(--green)", red: "var(--red)" };
  return (
    <div
      className="f-display"
      style={{
        background: "#fff",
        border: `1px solid ${colors[tone]}`,
        borderLeft: `4px solid ${colors[tone]}`,
        color: "var(--ink)",
        padding: "10px 14px",
        borderRadius: 3,
        fontSize: 13.5,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <AlertTriangle size={15} style={{ color: colors[tone], marginTop: 2, flexShrink: 0 }} />
      <div>{children}</div>
    </div>
  );
}

export function ModalShell({ children, onClose, title, wide }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(20,22,18,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
      onClick={onClose}
    >
      <div
        className="bib-root bib-scroll"
        style={{ background: "var(--paper)", borderRadius: 6, width: wide ? 720 : 460, maxHeight: "88vh", overflowY: "auto", padding: 24, border: "1px solid var(--rule)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 className="f-display" style={{ fontSize: 18 }}>{title}</h2>
          <button className="bib-btn bib-btn-ghost" onClick={onClose}>
            <X size={14} /> Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
