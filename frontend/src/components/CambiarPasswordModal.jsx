import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { ModalShell } from "./shared.jsx";

export default function CambiarPasswordModal({ onClose, onCambiar }) {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState(false);

  const valido = passwordActual.trim() && passwordNueva.length >= 4 && passwordNueva === confirmacion;

  const guardar = async () => {
    setError("");
    if (passwordNueva !== confirmacion) {
      setError("La nueva contrasena y su confirmacion no coinciden.");
      return;
    }
    setGuardando(true);
    try {
      await onCambiar(passwordActual, passwordNueva);
      setHecho(true);
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contrasena.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell onClose={onClose} title="Cambiar mi contrasena">
      {hecho ? (
        <div>
          <p style={{ fontSize: 13.5, marginBottom: 14 }}>Tu contrasena se actualizo correctamente.</p>
          <button className="bib-btn bib-btn-primary" onClick={onClose}>Listo</button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label className="bib-label">Contrasena actual</label>
            <input className="bib-input" type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} autoComplete="current-password" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="bib-label">Nueva contrasena (minimo 4 caracteres)</label>
            <input className="bib-input" type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="bib-label">Confirmar nueva contrasena</label>
            <input className="bib-input" type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} autoComplete="new-password" />
          </div>

          {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="bib-btn bib-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="bib-btn bib-btn-primary" disabled={!valido || guardando} onClick={guardar}>
              <KeyRound size={14} /> {guardando ? "Guardando..." : "Cambiar contrasena"}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
