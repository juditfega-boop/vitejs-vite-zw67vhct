import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

// 📦 las preguntas se guardan en paquetes para gastar pocas lecturas
const TAMANO_PAQUETE = 150;

export async function subirBanco(preguntasOriginales) {
  // quita campos vacíos raros que Firestore no acepta
  const preguntas = JSON.parse(JSON.stringify(preguntasOriginales));

  const paquetes = [];
  for (let i = 0; i < preguntas.length; i += TAMANO_PAQUETE) {
    paquetes.push(preguntas.slice(i, i + TAMANO_PAQUETE));
  }
  const demo = preguntas.filter((p) => p.demo);

  const lote = writeBatch(db);
  paquetes.forEach((lista, i) => {
    lote.set(doc(db, "banco", `paquete-${i}`), { preguntas: lista });
  });
  lote.set(doc(db, "banco", "indice"), {
    paquetes: paquetes.length,
    total: preguntas.length,
    actualizado: new Date().toISOString()
  });
  lote.set(doc(db, "demo", "paquete"), { preguntas: demo });
  await lote.commit();

  return { total: preguntas.length, paquetes: paquetes.length, demo: demo.length };
}
// 📖 lee las preguntas: el banco completo (cuentas aprobadas) o solo las de demo
export async function leerBanco(completo) {
  if (!completo) {
    const snap = await getDoc(doc(db, "demo", "paquete"));
    return snap.exists() ? snap.data().preguntas : [];
  }

  const indice = await getDoc(doc(db, "banco", "indice"));
  if (!indice.exists()) return [];

  const total = indice.data().paquetes;
  const paquetes = await Promise.all(
    Array.from({ length: total }, (_, i) => getDoc(doc(db, "banco", `paquete-${i}`)))
  );
  return paquetes.flatMap((s) => (s.exists() ? s.data().preguntas : []));
}