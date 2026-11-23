import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// 🗓️ Lectura del calendario (Mi calendario) para Inicio y Mi expediente.
// Se guarda también una copia en este dispositivo, para que la racha sepa
// qué días eran libres o de vacaciones aunque no haya conexión.
export const CLAVE_CALENDARIO_COPIA = "opo_calendario_copia_v1";

export function claveFecha(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export function copiaCalendario() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CALENDARIO_COPIA)) || { dias: {}, hechos: {} };
  } catch {
    return { dias: {}, hechos: {} };
  }
}

function guardarCopia(datos) {
  try {
    localStorage.setItem(CLAVE_CALENDARIO_COPIA, JSON.stringify(datos));
  } catch {}
}

// días libres o de vacaciones: no cuentan como día de estudio y no rompen la racha
export function esDiaDeDescanso(letra) {
  return letra === "L" || letra === "V";
}

// 🪝 calendario de la cuenta: { dias, hechos, cargado }
// recarga: cambia de valor cuando conviene volver a leerlo (al salir de Mi calendario)
export function useCalendario(usuario, recarga) {
  const [datos, setDatos] = useState(() => ({ ...copiaCalendario(), cargado: false }));

  useEffect(() => {
    if (!usuario) {
      setDatos({ dias: {}, hechos: {}, cargado: true });
      return;
    }
    let cancelado = false;
    getDoc(doc(db, "calendarios", usuario.uid))
      .then((snap) => {
        if (cancelado) return;
        const guardados = snap.exists() ? snap.data().dias || {} : {};
        const dias = {};
        Object.entries(guardados).forEach(([k, v]) => {
          dias[k] = v === "O" ? "L" : v;
        });
        const hechos = snap.exists() ? snap.data().hechos || {} : {};
        const omitidos = snap.exists() ? snap.data().omitidos || {} : {};
        guardarCopia({ dias, hechos });
        setDatos({ dias, hechos, omitidos, cargado: true });
      })
      .catch(() => {
        if (!cancelado) setDatos((d) => ({ ...d, cargado: true }));
      });
    return () => {
      cancelado = true;
    };
  }, [usuario?.uid, recarga]);

  // marca hoy como hecho en el calendario (cuando completas la ración)
  async function marcarHoyHecho() {
    if (!usuario) return;
    const clave = claveFecha();
    if (datos.hechos[clave]) return;
    const hechos = { ...datos.hechos, [clave]: true };
    setDatos((d) => ({ ...d, hechos }));
    guardarCopia({ dias: datos.dias, hechos });
    try {
      await setDoc(
        doc(db, "calendarios", usuario.uid),
        { hechos: { [clave]: true }, actualizado: new Date().toISOString() },
        { merge: true }
      );
    } catch {
      // si falla, se queda marcado en este dispositivo y se intentará la próxima vez
    }
  }

  return { ...datos, tipoHoy: datos.dias[claveFecha()] || null, marcarHoyHecho };
}
