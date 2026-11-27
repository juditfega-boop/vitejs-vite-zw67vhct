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
// 4 = ✨ dominada: estaba resuelta y la has vuelto a acertar en el repaso de mantenimiento (sale de la carpeta)
export const ESCALON = { NINGUNO: 0, PRIORITARIO: 1, SEGUIMIENTO: 2, RESUELTO: 3, DOMINADA: 4 };

export function escalonDe(s) {
  if (!s) return ESCALON.NINGUNO;
  if (s.escalon !== undefined) return s.escalon;
  // preguntas anteriores a este sistema: se reparten con la regla antigua
  if (!s.errores) return ESCALON.NINGUNO;
  if (s.aciertos >= s.errores) return ESCALON.RESUELTO;
  return ESCALON.PRIORITARIO;
}

// 🔁 repaso espaciado de los test: una pregunta fallada vuelve a los 1, 3, 7 y 21 días
// (fallo → mañana; cada acierto la manda más lejos; acertada a los 21 días → dominada)
export const INTERVALOS_TEST = [1, 3, 7, 21];

export function diaDeHoy(sumar = 0) {
  const d = new Date();
  d.setDate(d.getDate() + sumar);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ¿le toca volver a salir hoy (o se quedó atrasada)?
export function tocaRepasar(s) {
  return !!(s && s.repaso && s.repaso.proxima <= diaDeHoy());
}

// devuelve en qué escalón estaba y en cuál queda, por si la pantalla quiere celebrarlo
// mantenimiento = true cuando respondes desde «Casos resueltos → Repaso de mantenimiento»
export function registrarRespuesta(pregunta, correcta, mantenimiento = false) {
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
    // acertada otra vez en el repaso de mantenimiento: sale de casos resueltos
    else if (antes === ESCALON.RESUELTO && mantenimiento) despues = ESCALON.DOMINADA;
  } else {
    stats[id].errores += 1;
    // un fallo, esté donde esté, la devuelve a 🔴
    despues = ESCALON.PRIORITARIO;
  }
  // 🔁 cuándo vuelve a salir en los test (solo las que alguna vez has fallado)
  if (!correcta) {
    stats[id].repaso = { paso: 0, proxima: diaDeHoy(INTERVALOS_TEST[0]) };
  } else if (stats[id].repaso) {
    const paso = stats[id].repaso.paso + 1;
    if (paso >= INTERVALOS_TEST.length) {
      delete stats[id].repaso; // acertada a los 21 días: ya no se fuerza
      if (despues === ESCALON.RESUELTO) despues = ESCALON.DOMINADA;
    } else {
      stats[id].repaso = { paso, proxima: diaDeHoy(INTERVALOS_TEST[paso]) };
    }
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

  const nuevaRacha =
    datos.ultimaFecha === ayerStr || soloDescansoEntre(datos.ultimaFecha, hoy) ? datos.racha + 1 : 1;

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

// cuentaParaHoy = false cuando solo se copian los niveles desde la nube (no es una ficha hecha hoy)
export function guardarNivelesErre(niveles, cuentaParaHoy = true) {
  localStorage.setItem(CLAVE_ERRE, JSON.stringify(niveles));
  if (cuentaParaHoy) marcarRacion("erre");
}

// 🗓️ ¿entre esos dos días (sin contarlos) solo hubo días libres o de vacaciones del calendario?
// Así, descansar lo que tenías planificado no rompe la racha.
function soloDescansoEntre(desde, hasta) {
  if (!desde) return false;
  let dias = {};
  try {
    dias = (JSON.parse(localStorage.getItem("opo_calendario_copia_v1")) || {}).dias || {};
  } catch {}
  const d = new Date(desde + "T12:00:00");
  d.setDate(d.getDate() + 1);
  let hayHueco = false;
  for (let i = 0; i < 60; i++) {
    const clave = d.toISOString().slice(0, 10);
    if (clave >= hasta) return hayHueco;
    if (dias[clave] !== "L" && dias[clave] !== "V") return false;
    hayHueco = true;
    d.setDate(d.getDate() + 1);
  }
  return false;
}

// 🔥 la racha que sigue viva hoy (si el último día fue hace tiempo y no eran
// días de descanso, ya se ha roto aunque esté guardada)
export function rachaVigente() {
  const { ultimaFecha, racha } = obtenerRacha();
  if (!ultimaFecha) return 0;
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().slice(0, 10);
  if (ultimaFecha === hoy || ultimaFecha === ayerStr) return racha;
  // ¿todos los días desde entonces hasta ayer fueron de descanso?
  return soloDescansoEntre(ultimaFecha, hoy) ? racha : 0;
}

// 🍲 "Tu ración de hoy": lo que ya has hecho hoy (se reinicia cada día)
// test = has terminado un test · errores = has terminado un repaso de errores
// erre = has hecho una ficha de Erre que erre · simulacro = has terminado un simulacro
export const CLAVE_RACION = "opo_racion_hoy_v1";

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function obtenerRacion() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_RACION)) || {};
    return datos.fecha === hoyLocal() ? datos : { fecha: hoyLocal() };
  } catch {
    return { fecha: hoyLocal() };
  }
}

export function marcarRacion(clave) {
  const datos = obtenerRacion();
  if (datos[clave]) return;
  datos[clave] = true;
  localStorage.setItem(CLAVE_RACION, JSON.stringify(datos));
}

// 🌱 "Tu jardín": preguntas resueltas (las que pasaron a 🟢 en Repasar errores).
// La planta nunca encoge: se guarda el máximo al que has llegado.
export const CLAVE_JARDIN = "opo_jardin_v1";

export function preguntasResueltasJardin() {
  const ahora = Object.values(obtenerStats()).filter((s) => escalonDe(s) === ESCALON.RESUELTO).length;
  let maximo = 0;
  try {
    maximo = (JSON.parse(localStorage.getItem(CLAVE_JARDIN)) || {}).maximo || 0;
  } catch {}
  if (ahora > maximo) {
    maximo = ahora;
    localStorage.setItem(CLAVE_JARDIN, JSON.stringify({ maximo }));
  }
  return maximo;
}
// 🌱 días cumplidos (el día que completas la ración): la planta de la semana crece con ellos
export const CLAVE_DIAS_CUMPLIDOS = "opo_dias_cumplidos_v1";

export function diasCumplidos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_DIAS_CUMPLIDOS)) || {};
  } catch {
    return {};
  }
}

export function marcarDiaCumplido(clave) {
  const dias = diasCumplidos();
  if (dias[clave]) return;
  dias[clave] = true;
  // solo hace falta guardar las últimas semanas
  const limite = new Date();
  limite.setDate(limite.getDate() - 60);
  const minimo = limite.toISOString().slice(0, 10);
  Object.keys(dias).forEach((k) => {
    if (k < minimo) delete dias[k];
  });
  localStorage.setItem(CLAVE_DIAS_CUMPLIDOS, JSON.stringify(dias));
}

// 🍲 lo que cada persona añade a su ración (de momento, una ficha de Erre que erre)
export const CLAVE_RACION_EXTRAS = "opo_racion_extras_v1";

export function obtenerExtrasRacion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RACION_EXTRAS)) || {};
  } catch {
    return {};
  }
}

export function guardarExtrasRacion(extras) {
  localStorage.setItem(CLAVE_RACION_EXTRAS, JSON.stringify(extras));
}
// 🌱 Erre que erre: el último artículo nuevo que empezaste ({ id, fecha })
// (un artículo nuevo al día, y no se abre otro hasta sellar el anterior)
export const CLAVE_ERRE_NUEVO = "opo_erre_nuevo_v1";

export function obtenerErreNuevo() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ERRE_NUEVO)) || null;
  } catch {
    return null;
  }
}

export function guardarErreNuevo(datos) {
  localStorage.setItem(CLAVE_ERRE_NUEVO, JSON.stringify(datos));
}
