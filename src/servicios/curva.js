import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

// Curva del olvido: cada cosa vuelve a los 1, 3, 7, 21 y 60 días
export const INTERVALOS = [1, 3, 7, 21, 60];
export const TOPE_DIARIO = 10;

export function claveDia(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function diaDentroDe(n) {
  const f = new Date();
  f.setDate(f.getDate() + n);
  return claveDia(f);
}

function refCurva() {
  if (!auth.currentUser) return null;
  return doc(db, "curvas", auth.currentUser.uid);
}

// { erre: { idArticulo: { paso, proxima } }, tarjetero: { idCarpeta: { paso, proxima } } }
export async function leerCurva() {
  const ref = refCurva();
  if (!ref) return {};
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}

// entra en la curva (vuelve mañana) solo si todavía no estaba
export async function entrarEnCurva(tipo, id) {
  const ref = refCurva();
  if (!ref) return;
  const snap = await getDoc(ref);
  const yaEsta = snap.exists() && (snap.data()[tipo] || {})[id];
  if (yaEsta) return;
  await setDoc(ref, { [tipo]: { [id]: { paso: 0, proxima: diaDentroDe(INTERVALOS[0]) } } }, { merge: true });
}

// resultado: "bien" (sube de intervalo), "casi" (repite el mismo), "mal" (vuelve mañana)
export async function apuntarRepaso(tipo, id, resultado) {
  const ref = refCurva();
  if (!ref) return null;
  const snap = await getDoc(ref);
  const actual = snap.exists() ? (snap.data()[tipo] || {})[id] : null;
  let paso = 0;
  if (actual && resultado === "bien") paso = Math.min(INTERVALOS.length - 1, actual.paso + 1);
  if (actual && resultado === "casi") paso = actual.paso;
  const nuevo = { paso, proxima: diaDentroDe(INTERVALOS[paso]) };
  await setDoc(ref, { [tipo]: { [id]: nuevo } }, { merge: true });
  return nuevo;
}

// lo que toca hoy (o se quedó atrasado), lo más antiguo primero
export function pendientesDeHoy(mapa = {}) {
  const hoy = claveDia();
  return Object.entries(mapa)
    .filter(([, v]) => v.proxima <= hoy)
    .sort((a, b) => a[1].proxima.localeCompare(b[1].proxima))
    .map(([id]) => id);
}

export function resumenProximos(mapa = {}) {
  const hoy = claveDia();
  const manana = diaDentroDe(1);
  const semana = diaDentroDe(7);
  let enManana = 0;
  let enSemana = 0;
  let larga = 0;
  Object.values(mapa).forEach((v) => {
    if (v.proxima === manana) enManana += 1;
    if (v.proxima > hoy && v.proxima <= semana) enSemana += 1;
    if (v.paso >= 4) larga += 1;
  });
  return { manana: enManana, semana: enSemana, larga };
}