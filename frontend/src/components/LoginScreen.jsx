import React, { useState } from "react";
import { LogIn } from "lucide-react";
import { GlobalStyles, Banner } from "./shared.jsx";

export default function LoginScreen({ onLogin }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await onLogin(correo, password);
    } catch (err) {
      setError(err.message || "Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bib-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <GlobalStyles />
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="f-display" style={{ fontSize: 20 }}>Banco Nacional de Ítems</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Pruebas Nacionales — Segundo Ciclo de Secundaria</div>
        </div>

        <form className="bib-card" style={{ padding: 20 }} onSubmit={submit}>
          <label className="bib-label">Correo institucional</label>
          <input
            className="bib-input"
            style={{ marginBottom: 12 }}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="nombre.apellido@minerd.gob.do"
            autoComplete="username"
            type="email"
          />
          <label className="bib-label">Contraseña</label>
          <input
            className="bib-input"
            style={{ marginBottom: 14 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
          />
          {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
          <button type="submit" className="bib-btn bib-btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={cargando}>
            <LogIn size={14} /> {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div style={{ marginTop: 14 }}>
            <Banner tone="amber">
              Modo desarrollo: las cuentas de prueba están en <code>backend/src/seed.js</code> (ejecuta <code>npm run seed</code> en el
              backend). Cámbialas antes de exponer este sistema fuera de tu equipo.
            </Banner>
          </div>
        )}
      </div>
    </div>
  );
}
