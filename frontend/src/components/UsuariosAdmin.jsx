import React, { useState } from "react";
import { UserPlus, Trash2, KeyRound, Save } from "lucide-react";
import { AREAS, ROL_LABELS } from "../lib/constants.js";
import { Banner } from "./shared.jsx";

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(2, 10);
}

function FilaUsuario({ user, onUpdate, onDelete, onResetPassword }) {
  const [draft, setDraft] = useState(user);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [passwordTemporal, setPasswordTemporal] = useState("");

  const guardar = async () => {
    setError("");
    setGuardando(true);
    try {
      await onUpdate(user.id, {
        nombre: draft.nombre,
        correo: draft.correo,
        rol: draft.rol,
        area: draft.rol === "elaborador" ? draft.area || AREAS[0].id : null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const resetear = async () => {
    setError("");
    try {
      const nueva = await onResetPassword(user.id);
      setPasswordTemporal(nueva);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bib-card" style={{ padding: 12, marginBottom: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.4fr 1fr 1fr auto auto auto", gap: 8, alignItems: "center" }}>
        <input className="bib-input" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} placeholder="Nombre" />
        <input className="bib-input" value={draft.correo} onChange={(e) => setDraft({ ...draft, correo: e.target.value })} placeholder="correo@minerd.gob.do" />
        <select className="bib-select" value={draft.rol} onChange={(e) => setDraft({ ...draft, rol: e.target.value, area: e.target.value === "elaborador" ? draft.area || AREAS[0].id : null })}>
          <option value="elaborador">Elaborador/a</option>
          <option value="revisor">Equipo técnico</option>
          <option value="administrador">Administrador/a</option>
        </select>
        <select className="bib-select" disabled={draft.rol !== "elaborador"} value={draft.area || ""} onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
          {draft.rol !== "elaborador" ? <option value="">— todas —</option> : AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <button className="bib-btn bib-btn-ghost" onClick={guardar} disabled={guardando} title="Guardar cambios">
          <Save size={13} />
        </button>
        <button className="bib-btn bib-btn-ghost" onClick={resetear} title="Restablecer contraseña">
          <KeyRound size={13} />
        </button>
        <button className="bib-btn bib-btn-ghost" style={{ color: "var(--red)" }} onClick={() => onDelete(user.id)} title="Eliminar cuenta">
          <Trash2 size={13} />
        </button>
      </div>
      {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>{error}</div>}
      {passwordTemporal && (
        <div style={{ marginTop: 8, fontSize: 12.5 }}>
          Nueva contraseña temporal: <span className="code-pill">{passwordTemporal}</span> — compártela de forma segura, no quedará visible de nuevo.
        </div>
      )}
    </div>
  );
}

export default function UsuariosAdmin({ users, onCreate, onUpdate, onDelete, onResetPassword }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", correo: "", rol: "elaborador", area: AREAS[0].id, password: generarPasswordTemporal() });
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);
  const [creado, setCreado] = useState(null);

  const crear = async () => {
    setError("");
    setCreando(true);
    try {
      await onCreate({ ...nuevo, area: nuevo.rol === "elaborador" ? nuevo.area : null });
      setCreado({ correo: nuevo.correo, password: nuevo.password });
      setNuevo({ nombre: "", correo: "", rol: "elaborador", area: AREAS[0].id, password: generarPasswordTemporal() });
      setMostrarForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta cuenta? No podrá deshacerse.")) return;
    await onDelete(id);
  };

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Usuarios</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>Directorio de cuentas con acceso a la plataforma.</p>

      {creado && (
        <div style={{ marginBottom: 14 }}>
          <Banner tone="green">
            Cuenta creada para <strong>{creado.correo}</strong>. Contraseña temporal: <span className="code-pill">{creado.password}</span> — compártela de forma segura.
          </Banner>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", marginBottom: 14 }}>
        {users.map((u) => (
          <FilaUsuario key={u.id} user={u} onUpdate={onUpdate} onDelete={eliminar} onResetPassword={onResetPassword} />
        ))}
      </div>

      {mostrarForm ? (
        <div className="bib-card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="f-display" style={{ fontSize: 14, marginBottom: 10 }}>Nueva cuenta</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.4fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <input className="bib-input" placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            <input className="bib-input" placeholder="correo@minerd.gob.do" value={nuevo.correo} onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })} />
            <select className="bib-select" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
              {Object.entries(ROL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select className="bib-select" disabled={nuevo.rol !== "elaborador"} value={nuevo.area || ""} onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })}>
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <input className="bib-input" placeholder="Contraseña temporal" value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} />
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="bib-btn bib-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button className="bib-btn bib-btn-primary" disabled={creando || !nuevo.nombre.trim() || !nuevo.correo.trim()} onClick={crear}>
              {creando ? "Creando…" : "Crear cuenta"}
            </button>
          </div>
        </div>
      ) : (
        <button className="bib-btn bib-btn-ghost" onClick={() => setMostrarForm(true)}>
          <UserPlus size={14} /> Añadir usuario
        </button>
      )}
    </div>
  );
}
