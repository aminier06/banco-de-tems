export const ROLES = ["elaborador", "revisor", "administrador"];

export const AREAS = [
  { id: "lengua", nombre: "Lengua Española" },
  { id: "ciencias_naturaleza", nombre: "Ciencias de la Naturaleza" },
  { id: "ciencias_sociales", nombre: "Ciencias Sociales" },
  { id: "matematica", nombre: "Matemática" },
];
export const AREA_IDS = AREAS.map((a) => a.id);

export const DIFICULTADES = ["Baja", "Media", "Alta"];

export const ESTADOS = ["borrador", "en_revision", "aprobado", "rechazado"];

// Permisos centralizados: cada acción declara qué roles la pueden ejecutar.
// Se aplican en el servidor (esta función), no solo en la interfaz.
export const esTecnico = (rol: string) => rol === "revisor" || rol === "administrador";
export const esAdmin = (rol: string) => rol === "administrador";
