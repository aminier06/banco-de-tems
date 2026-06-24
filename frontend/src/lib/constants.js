export const AREAS = [
  { id: "lengua", nombre: "Lengua Española", abrev: "LE", color: "#1C3144" },
  { id: "ciencias_naturaleza", nombre: "Ciencias de la Naturaleza", abrev: "CN", color: "#3F6B4F" },
  { id: "ciencias_sociales", nombre: "Ciencias Sociales", abrev: "CS", color: "#8A4B2E" },
  { id: "matematica", nombre: "Matemática", abrev: "MA", color: "#56406B" },
];

export const DIFICULTADES = ["Baja", "Media", "Alta"];

export const ESTADOS = {
  borrador: { label: "Borrador", color: "#8A8579" },
  en_revision: { label: "En revisión", color: "#B8862B" },
  aprobado: { label: "Aprobado", color: "#3F6B4F" },
  rechazado: { label: "Rechazado", color: "#A23B3B" },
};
export const ORDEN_ESTADOS = ["borrador", "en_revision", "aprobado", "rechazado"];

export const ROL_LABELS = { elaborador: "Elaborador/a", revisor: "Equipo técnico", administrador: "Administrador/a" };

export const areaInfo = (id) => AREAS.find((a) => a.id === id);

export const esTecnico = (rol) => rol === "revisor" || rol === "administrador";
export const esAdmin = (rol) => rol === "administrador";
