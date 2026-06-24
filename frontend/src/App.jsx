import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Library, ClipboardList, FileText, Users, UploadCloud, LogOut, Check } from "lucide-react";
import { api } from "./api.js";
import { areaInfo, ROL_LABELS } from "./lib/constants.js";
import { GlobalStyles } from "./components/shared.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import BancoItems from "./components/BancoItems.jsx";
import ItemEditorModal from "./components/ItemEditorModal.jsx";
import RevisionModal from "./components/RevisionModal.jsx";
import SpecsEditor from "./components/SpecsEditor.jsx";
import ArmarPrueba from "./components/ArmarPrueba.jsx";
import TestPreviewModal from "./components/TestPreviewModal.jsx";
import UsuariosAdmin from "./components/UsuariosAdmin.jsx";
import ImportarItems from "./components/ImportarItems.jsx";

export default function App() {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const [items, setItems] = useState([]);
  const [specs, setSpecs] = useState({});
  const [tests, setTests] = useState([]);
  const [users, setUsers] = useState([]);

  const TABS_VALIDOS = ["dashboard", "banco", "specs", "armar", "importar", "usuarios"];
  const leerTabDesdeHash = () => {
    const h = window.location.hash.replace("#", "");
    return TABS_VALIDOS.includes(h) ? h : "dashboard";
  };

  const [tab, setTabInterno] = useState(leerTabDesdeHash);
  // Envuelve el setter original para que cada cambio de pestaña quede
  // reflejado en la URL (ej. .../#specs). Así, recargar la página o usar
  // los botones atrás/adelante del navegador mantiene la sección correcta.
  const setTab = useCallback((id) => {
    setTabInterno(id);
    if (window.location.hash !== `#${id}`) window.location.hash = id;
  }, []);

  useEffect(() => {
    const onHashChange = () => setTabInterno(leerTabDesdeHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const [editingItem, setEditingItem] = useState(null);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [previewTest, setPreviewTest] = useState(null);
  const [savingNote, setSavingNote] = useState("");

  const isRevisor = currentUser?.rol === "revisor";
  const isAdmin = currentUser?.rol === "administrador";
  const esTecnico = isRevisor || isAdmin;

  // Si la pestaña restaurada desde la URL no está disponible para este rol
  // (ej. alguien comparte un enlace a "#usuarios" con un elaborador), vuelve
  // al panel general en lugar de dejar la pantalla en blanco.
  useEffect(() => {
    if (!currentUser) return;
    if (tab === "armar" && !esTecnico) setTab("dashboard");
    if ((tab === "importar" || tab === "usuarios") && !isAdmin) setTab("dashboard");
  }, [currentUser, tab, esTecnico, isAdmin, setTab]);

  const flashSaved = (msg) => {
    setSavingNote(msg);
    setTimeout(() => setSavingNote(""), 2200);
  };

  // --- restaurar sesión a partir del token guardado ---
  useEffect(() => {
    async function restaurar() {
      if (!api.getToken()) {
        setCargandoSesion(false);
        return;
      }
      try {
        const user = await api.me();
        setCurrentUser(user);
      } catch (e) {
        api.logout();
      } finally {
        setCargandoSesion(false);
      }
    }
    restaurar();
  }, []);

  // --- cargar datos una vez hay sesión ---
  const recargarTodo = useCallback(async () => {
    setCargandoDatos(true);
    try {
      const [itemsRes, specsRes, testsRes, usersRes] = await Promise.all([
        api.listItems(),
        api.getSpecs(),
        api.listTests(),
        api.listUsers().catch(() => []), // solo admin puede listar; otros roles reciben 403
      ]);
      setItems(itemsRes);
      setSpecs(specsRes);
      setTests(testsRes);
      setUsers(usersRes);
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) recargarTodo();
  }, [currentUser, recargarTodo]);

  const login = async (correo, password) => {
    const user = await api.login(correo, password);
    setCurrentUser(user);
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
    setItems([]);
    setSpecs({});
    setTests([]);
    setUsers([]);
    setTab("dashboard");
  };

  /* ---------- permisos a nivel de interfaz ----------
     El servidor vuelve a validar todo esto; aquí solo se usa para decidir
     qué mostrar. Quitar un botón de la pantalla no es seguridad real — la
     seguridad real está en el backend (ver src/auth.js del backend). */
  const puedeEditar = (item) =>
    !!currentUser && (esTecnico || (item.autorId === currentUser.id && (item.estado === "borrador" || item.estado === "rechazado")));
  const puedeEnviar = (item) =>
    !!currentUser && item.autorId === currentUser.id && (item.estado === "borrador" || item.estado === "rechazado");
  const puedeRevisarItem = (item) => esTecnico && item.estado === "en_revision";
  const puedeCrearEn = (areaId) => !!currentUser && (esTecnico || currentUser.area === areaId);

  /* ---------- mutaciones de ítems ---------- */
  const guardarItem = async (form, esNuevo) => {
    if (esNuevo) {
      await api.createItem(form);
    } else {
      await api.updateItem(form.id, form);
    }
    await recargarTodo();
    flashSaved(esNuevo ? "Ítem creado." : "Ítem actualizado.");
    setEditingItem(null);
  };

  const enviarRevision = async (item) => {
    await api.submitItem(item.id);
    await recargarTodo();
    flashSaved("Ítem enviado a revisión.");
  };

  const decidirRevision = async (item, aprobar, comentario) => {
    await api.reviewItem(item.id, aprobar, comentario);
    await recargarTodo();
    setReviewingItem(null);
    flashSaved(aprobar ? "Ítem aprobado." : "Ítem rechazado.");
  };

  const eliminarItem = async (item) => {
    await api.deleteItem(item.id);
    await recargarTodo();
    flashSaved("Ítem eliminado.");
  };

  /* ---------- especificaciones ---------- */
  const guardarSpec = async (areaId, payload) => {
    await api.saveSpec(areaId, payload);
    await recargarTodo();
    flashSaved("Especificaciones guardadas.");
  };

  /* ---------- pruebas armadas ---------- */
  const guardarTest = async (payload) => {
    await api.createTest(payload);
    await recargarTodo();
    flashSaved("Prueba guardada.");
  };
  const eliminarTest = async (id) => {
    await api.deleteTest(id);
    await recargarTodo();
    flashSaved("Prueba eliminada.");
  };

  /* ---------- usuarios ---------- */
  const crearUsuario = async (payload) => {
    await api.createUser(payload);
    await recargarTodo();
  };
  const actualizarUsuario = async (id, payload) => {
    await api.updateUser(id, payload);
    await recargarTodo();
  };
  const eliminarUsuario = async (id) => {
    await api.deleteUser(id);
    await recargarTodo();
  };
  const restablecerPassword = async (id) => api.resetPassword(id);

  /* ---------- importación ---------- */
  const importarItems = async (payload, nombreArchivo) => {
    const res = await api.importItems(payload, nombreArchivo);
    await recargarTodo();
    return res;
  };

  /* ============================================================
     RENDER
     ============================================================ */

  if (cargandoSesion) {
    return (
      <div className="bib-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div className="f-display" style={{ color: "var(--ink-soft)" }}>Cargando…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} />;
  }

  if (cargandoDatos && items.length === 0) {
    return (
      <div className="bib-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div className="f-display" style={{ color: "var(--ink-soft)" }}>Cargando banco de ítems…</div>
      </div>
    );
  }

  return (
    <div className="bib-root" style={{ minHeight: "100vh", display: "flex" }}>
      <GlobalStyles />

      <aside style={{ width: 220, background: "var(--navy)", padding: "18px 12px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <div className="f-display" style={{ color: "#fff", fontSize: 16, padding: "0 10px 16px", lineHeight: 1.25, borderBottom: "1px solid rgba(255,255,255,0.14)", marginBottom: 10 }}>
          Banco Nacional<br />de Ítems
        </div>
        {[
          { id: "dashboard", label: "Panel general", icon: LayoutDashboard },
          { id: "banco", label: "Banco de ítems", icon: Library },
          { id: "specs", label: "Especificaciones", icon: ClipboardList },
          ...(esTecnico ? [{ id: "armar", label: "Armar prueba", icon: FileText }] : []),
          ...(isAdmin ? [{ id: "importar", label: "Importar ítems", icon: UploadCloud }] : []),
          ...(isAdmin ? [{ id: "usuarios", label: "Usuarios", icon: Users }] : []),
        ].map((t) => (
          <div key={t.id} className={`navlink ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <t.icon size={16} /> {t.label}
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.14)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{currentUser.nombre}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>{ROL_LABELS[currentUser.rol] || currentUser.rol}</div>
          {currentUser.area && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>Área asignada: {areaInfo(currentUser.area)?.nombre}</div>
          )}
          <button className="bib-btn bib-btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }} onClick={logout}>
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="bib-scroll" style={{ flex: 1, background: "var(--paper)", padding: 24, overflowY: "auto", maxHeight: "100vh" }}>
        {savingNote && (
          <div style={{ position: "sticky", top: 0, zIndex: 5, marginBottom: 12 }}>
            <div className="bib-card" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 12.5, color: "var(--green)" }}>
              <Check size={14} /> {savingNote}
            </div>
          </div>
        )}

        {tab === "dashboard" && <Dashboard items={items} tests={tests} puedeRevisar={esTecnico} onGoBanco={() => setTab("banco")} />}

        {tab === "banco" && (
          <BancoItems
            items={items}
            specs={specs}
            currentUser={currentUser}
            puedeEliminarItems={isAdmin}
            onNuevo={(areaId) => setEditingItem({ nuevoEnArea: areaId })}
            onEditar={(item) => setEditingItem(item)}
            onRevisar={(item) => setReviewingItem(item)}
            onEnviar={enviarRevision}
            onEliminar={eliminarItem}
            puedeEditar={puedeEditar}
            puedeEnviar={puedeEnviar}
            puedeRevisar={puedeRevisarItem}
            puedeCrearEn={puedeCrearEn}
          />
        )}

        {tab === "specs" && <SpecsEditor specs={specs} puedeEditar={esTecnico} onSave={guardarSpec} />}

        {tab === "armar" && esTecnico && (
          <ArmarPrueba
            items={items}
            specs={specs}
            tests={tests}
            puedeEliminarPrueba={isAdmin}
            onSaveTest={guardarTest}
            onDeleteTest={eliminarTest}
            onPreview={(t) => setPreviewTest(t)}
          />
        )}

        {tab === "importar" && isAdmin && (
          <ImportarItems specs={specs} users={users} currentUser={currentUser} onImportar={importarItems} />
        )}

        {tab === "usuarios" && isAdmin && (
          <UsuariosAdmin users={users} onCreate={crearUsuario} onUpdate={actualizarUsuario} onDelete={eliminarUsuario} onResetPassword={restablecerPassword} />
        )}
      </main>

      {editingItem && (
        <ItemEditorModal itemSeed={editingItem} specs={specs} currentUser={currentUser} onClose={() => setEditingItem(null)} onSave={guardarItem} />
      )}

      {reviewingItem && <RevisionModal item={reviewingItem} onClose={() => setReviewingItem(null)} onDecidir={decidirRevision} />}

      {previewTest && <TestPreviewModal test={previewTest} items={items} onClose={() => setPreviewTest(null)} />}
    </div>
  );
}
