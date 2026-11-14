import { doc, writeBatch } from "firebase/firestore";
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