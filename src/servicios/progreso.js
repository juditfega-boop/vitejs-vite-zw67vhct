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

// 🗂️ escalón de cada pregunta en "Repasar errores"
// 0 = nunca fallada · 1 = 🔴 prioritaria · 2 = 🟡 en seguimiento · 3 = 🟢 resuelta
export const ESCALON = { NINGUNO: 0, PRIORITARIO: 1, SEGUIMIENTO: 2, RESUELTO: 3 };

export function escalonDe(s) {
  if (!s) return ESCALON.NINGUNO;
  if (s.escalon !== undefined) return s.escalon;
  // preguntas anteriores a este sistema: se reparten con la regla antigua
  if (!s.errores) return ESCALON.NINGUNO;
  if (s.aciertos >= s.errores) return ESCALON.RESUELTO;
  return ESCALON.PRIORITARIO;
}

// devuelve en qué escalón estaba y en cuál queda, por si la pantalla quiere celebrarlo
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

  const antes = escalonDe(stats[id]);
  let despues = antes;

  stats[id].veces += 1;
  if (correcta) {
    stats[id].aciertos += 1;
    // un acierto sube un escalón: 🔴 → 🟡 → 🟢
    if (antes === ESCALON.PRIORITARIO || antes === ESCALON.SEGUIMIENTO) despues = antes + 1;
  } else {
    stats[id].errores += 1;
    // un fallo, esté donde esté, la devuelve a 🔴
    despues = ESCALON.PRIORITARIO;
  }
  stats[id].escalon = despues;

  guardarStats(stats);
  return { antes, despues };
}

// reparte una lista de preguntas en las tres categorías de "Repasar errores"
export function clasificarErrores(preguntas) {
  const stats = obtenerStats();
  const prioritarios = [];
  const seguimiento = [];
  const resueltos = [];
  preguntas.forEach((p) => {
    const e = escalonDe(stats[String(p.id)]);
    if (e === ESCALON.PRIORITARIO) prioritarios.push(p);
    else if (e === ESCALON.SEGUIMIENTO) seguimiento.push(p);
    else if (e === ESCALON.RESUELTO) resueltos.push(p);
  });
  // las que más veces se han fallado, primero
  const errores = (p) => stats[String(p.id)]?.errores || 0;
  prioritarios.sort((a, b) => errores(b) - errores(a));
  return { prioritarios, seguimiento, resueltos };
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
// 💾 partida de estudio a medias (para continuar más tarde)
export const CLAVE_PARTIDA = "opo_partida_estudio_v1";

export function obtenerPartida() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PARTIDA));
  } catch {
    return null;
  }
}

export function guardarPartida(datos) {
  localStorage.setItem(CLAVE_PARTIDA, JSON.stringify({ ...datos, fecha: Date.now() }));
}

export function borrarPartida() {
  localStorage.removeItem(CLAVE_PARTIDA);
}
// 🔁 Erre que erre: nivel de cada ficha (1 con pistas, 2 huecos, 3 de memoria)
export const CLAVE_ERRE = "opo_erre_niveles_v1";

export function obtenerNivelesErre() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ERRE)) || {};
  } catch {
    return {};
  }
}

export function guardarNivelesErre(niveles) {
  localStorage.setItem(CLAVE_ERRE, JSON.stringify(niveles));
}