const CLAVE_PERSONAJE_ACTIVO = "asistontas_personaje_activo_v1";

export function obtenerPersonajeActivo() {
  return localStorage.getItem(CLAVE_PERSONAJE_ACTIVO) || "mary-richmond";
}

export function establecerPersonajeActivo(id) {
  localStorage.setItem(CLAVE_PERSONAJE_ACTIVO, id);
}