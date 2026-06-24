import React, { useState, useMemo } from "react";
import { Download, UploadCloud, X, AlertTriangle, Check } from "lucide-react";
import { AREAS } from "../lib/constants.js";
import {
  CAMPOS_IMPORTACION,
  parseArchivoBanco,
  autoMapearColumnas,
  descargarPlantillaCSV,
  resolverArea,
  resolverDificultad,
  resolverIndiceRespuesta,
  resolverClasificacion,
  resolverAutor,
} from "../lib/utils.js";
import { Banner } from "./shared.jsx";

export default function ImportarItems({ specs, users, currentUser, onImportar }) {
  const [archivo, setArchivo] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [filas, setFilas] = useState([]);
  const [mapping, setMapping] = useState({});
  const [areaFija, setAreaFija] = useState(AREAS[0].id);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [importando, setImportando] = useState(false);

  const onArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResultado(null);
    try {
      const { headers: hs, rows } = await parseArchivoBanco(file);
      if (rows.length === 0) {
        setError("El archivo no tiene filas de datos.");
        return;
      }
      setArchivo(file);
      setHeaders(hs);
      setFilas(rows);
      setMapping(autoMapearColumnas(hs));
    } catch (err) {
      setError("No se pudo leer el archivo. Verifica que sea un .csv o .xlsx válido.");
    }
  };

  const filasProcesadas = useMemo(() => {
    if (filas.length === 0) return [];
    return filas.map((row, idx) => {
      const val = (key) => (mapping[key] ? (row[mapping[key]] ?? "").toString().trim() : "");
      const areaDetectada = mapping.area ? resolverArea(val("area")) : null;
      const area = areaDetectada || areaFija;
      const dificultadDetectada = resolverDificultad(val("dificultad"));
      const clasif = resolverClasificacion(area, val("competencia"), val("afirmacion"), val("evidencia"), val("tarea"), specs);
      const opciones = ["opcionA", "opcionB", "opcionC", "opcionD"].map((k) => val(k));
      const idxRespuesta = resolverIndiceRespuesta(val("respuestaCorrecta"));
      const enunciado = val("enunciado");
      const justCorrecta = val("justificacionCorrecta");

      const errores = [];
      if (!area) errores.push("Área no reconocida.");
      if (!enunciado) errores.push("Falta el enunciado.");
      if (opciones.some((o) => !o)) errores.push("Faltan una o más opciones (A–D).");
      if (idxRespuesta === null) errores.push("No se reconoce la respuesta correcta.");

      const advertencias = [];
      if (area && !clasif.afirmacionId) advertencias.push("Sin afirmación/evidencia reconocida; quedará pendiente de clasificar.");
      if (mapping.dificultad && !dificultadDetectada) advertencias.push('Dificultad no reconocida, se usará "Media".');
      if (!justCorrecta) advertencias.push("Sin justificación de la respuesta correcta.");

      return {
        idx,
        area,
        afirmacionId: clasif.afirmacionId,
        evidenciaId: clasif.evidenciaId,
        tareaId: clasif.tareaId,
        competenciaId: clasif.competenciaId,
        dificultad: dificultadDetectada || "Media",
        tipoTexto: val("tipoTexto"),
        contexto: val("contexto"),
        enunciado,
        opciones,
        respuestaCorrecta: idxRespuesta,
        justificacionCorrecta: justCorrecta,
        justificacionDistractores: val("justificacionDistractores"),
        autorId: resolverAutor(val("autor"), users, currentUser.id),
        errores,
        advertencias,
      };
    });
  }, [filas, mapping, areaFija, specs, users, currentUser.id]);

  const importables = filasProcesadas.filter((f) => f.errores.length === 0);
  const bloqueadas = filasProcesadas.filter((f) => f.errores.length > 0);

  const importar = async () => {
    setImportando(true);
    setError("");
    try {
      const payload = importables.map(({ errores, advertencias, idx, ...resto }) => resto);
      const res = await onImportar(payload, archivo?.name || "archivo externo");
      setResultado({ importados: res.importados, bloqueados: bloqueadas.length + (res.descartados || 0) });
      setArchivo(null);
      setHeaders([]);
      setFilas([]);
      setMapping({});
    } catch (err) {
      setError(err.message || "No se pudo completar la importación.");
    } finally {
      setImportando(false);
    }
  };

  return (
    <div>
      <h1 className="f-display" style={{ fontSize: 24, marginBottom: 2 }}>Importar ítems</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 16 }}>
        Migra ítems desde un archivo Excel o CSV del banco anterior. Todos entran como <strong>borrador</strong>, listos para que el equipo técnico los revise de nuevo.
      </p>

      <div className="bib-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onArchivo} />
          <button className="bib-btn bib-btn-ghost" onClick={descargarPlantillaCSV}>
            <Download size={13} /> Descargar plantilla CSV
          </button>
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 10 }}>{error}</div>}
        {resultado && (
          <div style={{ marginTop: 12 }}>
            <Banner tone="green">
              Se importaron <strong>{resultado.importados}</strong> ítem(s) como borrador.
              {resultado.bloqueados > 0 && ` ${resultado.bloqueados} fila(s) no se importaron por datos incompletos.`}
            </Banner>
          </div>
        )}
      </div>

      {headers.length > 0 && (
        <>
          <div className="bib-card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="f-display" style={{ fontSize: 14, marginBottom: 10 }}>Mapeo de columnas — {filas.length} fila(s) detectadas</div>
            <div style={{ marginBottom: 12 }}>
              <label className="bib-label">Área (si el archivo no tiene columna de área, o para filas sin coincidencia)</label>
              <select className="bib-select" style={{ width: 260 }} value={areaFija} onChange={(e) => setAreaFija(e.target.value)}>
                {AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {CAMPOS_IMPORTACION.map((c) => (
                <div key={c.key}>
                  <label className="bib-label">{c.label} {c.requerido && <span style={{ color: "var(--red)" }}>*</span>}</label>
                  <select className="bib-select" value={mapping[c.key] || ""} onChange={(e) => setMapping({ ...mapping, [c.key]: e.target.value })}>
                    <option value="">— no usar —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bib-card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span className="f-display" style={{ fontSize: 14 }}>Vista previa</span>
              <span style={{ fontSize: 12.5 }}>
                <span style={{ color: "var(--green)" }}>{importables.length} listas</span> · <span style={{ color: "var(--red)" }}>{bloqueadas.length} con error</span>
              </span>
            </div>
            <div className="bib-scroll" style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {filasProcesadas.map((f) => (
                <div key={f.idx} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", borderRadius: 3, background: f.errores.length ? "rgba(162,59,59,0.06)" : "transparent", fontSize: 12 }}>
                  {f.errores.length ? (
                    <X size={14} style={{ color: "var(--red)", marginTop: 2, flexShrink: 0 }} />
                  ) : f.advertencias.length ? (
                    <AlertTriangle size={14} style={{ color: "var(--amber)", marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <Check size={14} style={{ color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
                  )}
                  <div>
                    <div>
                      <span className="f-mono">Fila {f.idx + 1}</span> — {f.enunciado || <em style={{ color: "var(--ink-soft)" }}>(sin enunciado)</em>}
                    </div>
                    {[...f.errores, ...f.advertencias].length > 0 && <div style={{ color: "var(--ink-soft)" }}>{[...f.errores, ...f.advertencias].join(" · ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="bib-btn bib-btn-primary" disabled={importables.length === 0 || importando} onClick={importar}>
            <UploadCloud size={14} /> {importando ? "Importando…" : `Importar ${importables.length} ítem(s) como borrador`}
          </button>
        </>
      )}
    </div>
  );
}
