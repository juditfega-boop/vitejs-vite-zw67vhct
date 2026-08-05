import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";

export async function obtenerMisImpugnaciones() {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, "impugnaciones"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("fecha", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error al obtener impugnaciones:", e);
    return [];
  }
}

export async function enviarImpugnacion({ pregunta, motivo, comentario, origen }) {
  try {
    await addDoc(collection(db, "impugnaciones"), {
      preguntaId: pregunta?.id ?? null,
      textoPregunta: pregunta?.pregunta ?? "",
      bloque: pregunta?.bloque ?? null,
      articulo: pregunta?.articulo ?? null,
      motivo,
      comentario: comentario || "",
      origen: origen || "desconocido",
      estado: "pendiente",
      uid: auth.currentUser ? auth.currentUser.uid : null,
      fecha: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error("Error al enviar la impugnación:", e);
    return false;
  }
}