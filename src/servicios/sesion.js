import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// 🔑 identificador de la sesión de ESTE dispositivo
const CLAVE_SESION = "opo_sesion_id_v1";

// se llama justo antes de iniciar sesión, para que este dispositivo
// no se expulse a sí mismo mientras reclama la sesión
export function marcarSesionPendiente() {
  localStorage.setItem(CLAVE_SESION, "pendiente");
}

// este dispositivo pasa a ser el único válido para la cuenta
export async function reclamarSesion(uid) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  localStorage.setItem(CLAVE_SESION, id);
  await setDoc(doc(db, "sesiones", uid), { id, fecha: new Date().toISOString() });
}

// avisa si la cuenta se ha abierto en otro dispositivo
export function vigilarSesion(uid, alSerExpulsada) {
  return onSnapshot(
    doc(db, "sesiones", uid),
    (snap) => {
      if (!snap.exists()) return;
      const mia = localStorage.getItem(CLAVE_SESION);
      if (mia === "pendiente") return;
      if (snap.data().id !== mia) alSerExpulsada();
    },
    () => {}
  );
}