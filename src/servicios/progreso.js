// 📊 Servicios de progreso — todo lo que lee/escribe en localStorage.
//
// Estas funciones no dependen de React en absoluto: no usan hooks, no
// necesitan estado del componente. Por eso viven aquí, separadas, y se
// pueden importar desde App.jsx o desde cualquier minijuego sin duplicar
// código (antes, cada minijuego tenía su propia copia de estas mismas
// funciones).

export const CLAVE_STATS = "opo_stats_v1";
export const CLAVE_RACHA = "opo_racha_v1";
export const CLAVE_TIEMPOS = "opo_tiempos_v1";
export const CLAVE_FAVORITOS = "opo_favoritos_v1";
export const CLAVE_CODIGO = "opo_codigo_perfil_v1";

// 📈 estadísticas por pregunta (aciertos/errores)
export function obtenerStats() {
  return JSON.parse(localStorage.getItem(CLAVE_STATS)) || {};
}

export function guardarStats(stats) {
  localStorage.setItem(CLAVE_STATS, JSON.stringify(stats));
}

export function registrarRespuesta(pregunta, correcta) {
  const stats = obtenerStats();
  const id = String(pregunta.id);

  if (!stats[id]) {
    stats[id] = {
      id,
      bloque: pregunta.bloque || "Sin bloque",
      aciertos: 0,
      errores: 0,
      veces: 0
    };
  }

  stats[id].veces += 1;
  if (correcta) {
    stats[id].aciertos += 1;
  } else {
    stats[id].errores += 1;
  }

  guardarStats(stats);
}

// 🔥 racha de estudio (días consecutivos)
export function obtenerRacha() {
  return JSON.parse(localStorage.getItem(CLAVE_RACHA)) || { ultimaFecha: null, racha: 0 };
}

export function actualizarRacha() {
  const hoy = new Date().toISOString().slice(0, 10);
  const datos = obtenerRacha();

  if (datos.ultimaFecha === hoy) return;

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().slice(0, 10);

  const nuevaRacha = datos.ultimaFecha === ayerStr ? datos.racha + 1 : 1;

  localStorage.setItem(CLAVE_RACHA, JSON.stringify({ ultimaFecha: hoy, racha: nuevaRacha }));
}

// ⏱️ tiempo medio por pregunta
export function obtenerTiempos() {
  return JSON.parse(localStorage.getItem(CLAVE_TIEMPOS)) || {
    totalSegundos: 0,
    totalPreguntas: 0
  };
}

export function registrarTiempoPregunta(segundos) {
  const datos = obtenerTiempos();
  datos.totalSegundos += segundos;
  datos.totalPreguntas += 1;
  localStorage.setItem(CLAVE_TIEMPOS, JSON.stringify(datos));
}

// ⭐ favoritos
export function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || [];
}

export function guardarFavoritos(lista) {
  localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));
}