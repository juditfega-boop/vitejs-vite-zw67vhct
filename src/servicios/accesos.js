import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const ADMIN_UID = "qOEQ6hUDVKZvkgqFOPleSuVt10v2";

// devuelve "aprobada" | "pendiente"; si la cuenta es nueva, crea su solicitud
export async function obtenerEstadoAcceso(usuario) {
  if (usuario.uid === ADMIN_UID) return "aprobada";
  const ref = doc(db, "accesos", usuario.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { email: usuario.email, estado: "pendiente", creado: serverTimestamp() });
    return "pendiente";
  }
  return snap.data().estado;
}

export async function listarPendientes() {
  const q = query(collection(db, "accesos"), where("estado", "==", "pendiente"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export function aprobarCuenta(uid) {
  return updateDoc(doc(db, "accesos", uid), { estado: "aprobada" });
}