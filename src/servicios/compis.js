import {
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    serverTimestamp,
    writeBatch
  } from "firebase/firestore";
  import { db } from "../firebase";
  
  // 💾 mismas claves que usa la carrera online
  export const CLAVE_NOMBRE_APP = "opo_carrera_nombre_v1";
  export const CLAVE_SALA_CARRERA = "opo_carrera_sala_v1";
  const CLAVE_ENVIADOS = "opo_hechizos_enviados_v1";
  export const MAX_HECHIZOS_DIA = 3;
  
  const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  
  function codigoAleatorio() {
    let c = "";
    for (let i = 0; i < 6; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)];
    return c;
  }
  
  // 🙋 mi perfil de compi: nombre visible, código para que me añadan y lista de compis
  export async function asegurarPerfil(uid, nombrePorDefecto) {
    const ref = doc(db, "gente", uid);
    const snap = await getDoc(ref);
    const datos = snap.exists() ? snap.data() : {};
    const nombre = datos.nombre || nombrePorDefecto || "Sin nombre";
    let codigo = datos.codigo;
  
    if (!codigo) {
      for (let intento = 0; intento < 5 && !codigo; intento++) {
        const posible = codigoAleatorio();
        const existe = await getDoc(doc(db, "codigos", posible));
        if (!existe.exists()) {
          await setDoc(doc(db, "codigos", posible), { uid });
          codigo = posible;
        }
      }
    }
  
    await setDoc(ref, { nombre, codigo }, { merge: true });
    localStorage.setItem(CLAVE_NOMBRE_APP, nombre);
    return { nombre, codigo, compis: datos.compis || {} };
  }
  
  export async function cambiarMiNombre(uid, nombre) {
    await setDoc(doc(db, "gente", uid), { nombre }, { merge: true });
    localStorage.setItem(CLAVE_NOMBRE_APP, nombre);
  }
  
  // añade compis a MI lista (cada persona solo puede escribir en la suya)
  export function anadirCompis(uid, lista) {
    if (!lista.length) return Promise.resolve();
    const compis = {};
    lista.forEach((c) => {
      compis[c.uid] = { nombre: c.nombre || "" };
    });
    return setDoc(doc(db, "gente", uid), { compis }, { merge: true });
  }
  
  // añadir por código: me la apunto y le dejo un aviso para que ella me apunte a mí
  export async function anadirCompiPorCodigo(uid, miNombre, codigo) {
    const c = codigo.trim().toUpperCase();
    const snap = await getDoc(doc(db, "codigos", c));
    if (!snap.exists()) throw new Error("No hay nadie con ese código.");
    const otroUid = snap.data().uid;
    if (otroUid === uid) throw new Error("Ese es tu propio código 😊");
    const otro = await getDoc(doc(db, "gente", otroUid));
    const nombre = otro.exists() ? otro.data().nombre : "";
    await anadirCompis(uid, [{ uid: otroUid, nombre }]);
    await mandarAviso(otroUid, { tipo: "compi", de: uid, nombre: miNombre });
    return nombre;
  }
  
  // lista de compis con su nombre actualizado
  export async function listarCompis(compisGuardadas) {
    const ids = Object.keys(compisGuardadas || {});
    const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "gente", id))));
    return ids
      .map((id, i) => ({
        uid: id,
        nombre: (docs[i].exists() && docs[i].data().nombre) || compisGuardadas[id].nombre || "Sin nombre"
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  
  // ✉️ avisos
  export function mandarAviso(paraUid, datos) {
    return addDoc(collection(db, "buzon", paraUid, "avisos"), {
      ...datos,
      leido: false,
      fecha: serverTimestamp()
    });
  }
  
  export function vigilarBuzon(uid, alCambiar) {
    const q = query(collection(db, "buzon", uid, "avisos"), orderBy("fecha", "desc"), limit(20));
    return onSnapshot(
      q,
      (snap) => alCambiar(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
  }
  
  export function marcarLeidos(uid, avisos) {
    const pendientes = avisos.filter((a) => !a.leido);
    if (!pendientes.length) return Promise.resolve();
    const lote = writeBatch(db);
    pendientes.forEach((a) => lote.update(doc(db, "buzon", uid, "avisos", a.id), { leido: true }));
    return lote.commit();
  }
  
  export function borrarAviso(uid, avisoId) {
    return deleteDoc(doc(db, "buzon", uid, "avisos", avisoId));
  }
  
  export function marcarAvisoProcesado(uid, avisoId) {
    return updateDoc(doc(db, "buzon", uid, "avisos", avisoId), { procesado: true });
  }
  
  // ⏳ máximo de hechizos al día a la misma persona (se cuenta en este dispositivo)
  function hoy() {
    return new Date().toISOString().slice(0, 10);
  }
  
  export function hechizosRestantes(paraUid) {
    const datos = JSON.parse(localStorage.getItem(CLAVE_ENVIADOS) || "{}");
    if (datos.fecha !== hoy()) return MAX_HECHIZOS_DIA;
    return Math.max(0, MAX_HECHIZOS_DIA - ((datos.conteo || {})[paraUid] || 0));
  }
  
  export async function mandarHechizo(deUid, deNombre, paraUid, hechizo, extra = {}) {
    if (hechizosRestantes(paraUid) <= 0) throw new Error("Por hoy ya le has mandado bastantes hechizos ✨");
    await mandarAviso(paraUid, { tipo: "hechizo", hechizo, de: deUid, nombre: deNombre, ...extra });
    const datos = JSON.parse(localStorage.getItem(CLAVE_ENVIADOS) || "{}");
    const nuevo = datos.fecha === hoy() ? datos : { fecha: hoy(), conteo: {} };
    nuevo.conteo[paraUid] = (nuevo.conteo[paraUid] || 0) + 1;
    localStorage.setItem(CLAVE_ENVIADOS, JSON.stringify(nuevo));
  }
// 🙋 "Necesito un empujón": aviso a las compis que elijas (una vez al día)
const CLAVE_EMPUJON = "opo_empujon_pedido_v1";

export function empujonPedidoHoy() {
  return localStorage.getItem(CLAVE_EMPUJON) === hoy();
}

export async function pedirEmpujon(deUid, deNombre, elegidos) {
  if (empujonPedidoHoy()) throw new Error("Hoy ya lo has pedido 💛");
  if (!elegidos.length) throw new Error("Elige al menos a un compi.");
  await Promise.all(elegidos.map((c) => mandarAviso(c.uid, { tipo: "empujon", de: deUid, nombre: deNombre })));
  localStorage.setItem(CLAVE_EMPUJON, hoy());
}
// 🪄 quitar a alguien de MI lista (en la suya sigo estando yo)
import { deleteField as borrarCampo } from "firebase/firestore";

export function quitarCompi(uid, compiUid) {
  return updateDoc(doc(db, "gente", uid), { [`compis.${compiUid}`]: borrarCampo() });
}