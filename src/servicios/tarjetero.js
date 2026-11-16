import {
    collection,
    doc,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    writeBatch,
    increment,
    serverTimestamp
  } from "firebase/firestore";
  import { db, auth } from "../firebase";
  
  // 🗂️ Mi tarjetero: tarjeteros/{cuenta}/carpetas/{carpeta}/tarjetas/{tarjeta}
  function carpetasRef() {
    return collection(db, "tarjeteros", auth.currentUser.uid, "carpetas");
  }
  function tarjetasRef(carpetaId) {
    return collection(db, "tarjeteros", auth.currentUser.uid, "carpetas", carpetaId, "tarjetas");
  }
  
  export async function listarCarpetas() {
    const snap = await getDocs(query(carpetasRef(), orderBy("nombre")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  export function crearCarpeta(nombre) {
    return addDoc(carpetasRef(), { nombre, total: 0, creado: serverTimestamp() });
  }
  
  export function renombrarCarpeta(id, nombre) {
    return updateDoc(doc(carpetasRef(), id), { nombre });
  }
  
  export async function borrarCarpeta(id) {
    const tarjetas = await getDocs(tarjetasRef(id));
    const lote = writeBatch(db);
    tarjetas.docs.forEach((d) => lote.delete(d.ref));
    lote.delete(doc(carpetasRef(), id));
    await lote.commit();
  }
  
  export async function listarTarjetas(carpetaId) {
    const snap = await getDocs(query(tarjetasRef(carpetaId), orderBy("orden")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  
  export async function anadirTarjeta(carpetaId, imagen, orden) {
    await addDoc(tarjetasRef(carpetaId), { imagen, orden, creado: serverTimestamp() });
    await updateDoc(doc(carpetasRef(), carpetaId), { total: increment(1) });
  }
  
  export async function borrarTarjeta(carpetaId, tarjetaId) {
    await deleteDoc(doc(tarjetasRef(carpetaId), tarjetaId));
    await updateDoc(doc(carpetasRef(), carpetaId), { total: increment(-1) });
  }
  
  // cambia de sitio dos tarjetas
  export async function intercambiarOrden(carpetaId, a, b) {
    const lote = writeBatch(db);
    lote.update(doc(tarjetasRef(carpetaId), a.id), { orden: b.orden });
    lote.update(doc(tarjetasRef(carpetaId), b.id), { orden: a.orden });
    await lote.commit();
  }