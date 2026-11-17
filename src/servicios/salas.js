import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    onSnapshot,
    runTransaction,
    serverTimestamp
  } from "firebase/firestore";
  import { db } from "../firebase";
  
  // 🏃‍♀️ orden fijo de las corredoras: la primera que entra es la rosa, luego morada…
  export const COLORES_CORREDORA = ["rosa", "morado", "verde", "amarillo"];
  
  // sin letras que se confunden (I, O, 0, 1)
  const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  
  function codigoAleatorio() {
    let c = "";
    for (let i = 0; i < 4; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)];
    return c;
  }
  
  function jugadoraNueva(nombre, color) {
    return {
      nombre,
      color,
      aciertos: 0,
      errores: 0,
      respondidas: 0,
      tiempoTotal: 0,
      terminada: false,
      fallos: []
    };
  }
  
  export async function crearSala(uid, nombre) {
    for (let intento = 0; intento < 5; intento++) {
      const codigo = codigoAleatorio();
      const ref = doc(db, "salas", codigo);
      const existe = await getDoc(ref);
      if (existe.exists()) continue;
      await setDoc(ref, {
        anfitriona: uid,
        estado: "espera", // espera | jugando | terminada
        creada: serverTimestamp(),
        config: { tipo: "general", bloques: [], numPreguntas: 10 },
        preguntas: [],
        jugadoras: { [uid]: jugadoraNueva(nombre, COLORES_CORREDORA[0]) }
      });
      return codigo;
    }
    throw new Error("No se ha podido crear la partida. Inténtalo otra vez.");
  }
  
  export async function unirseSala(codigo, uid, nombre) {
    const ref = doc(db, "salas", codigo);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("No hay ninguna partida con ese código.");
      const sala = snap.data();
      if (sala.jugadoras && sala.jugadoras[uid]) return; // ya estaba dentro
      if (sala.estado !== "espera") throw new Error("Esa carrera ya ha empezado.");
      const usados = Object.values(sala.jugadoras || {}).map((j) => j.color);
      const libre = COLORES_CORREDORA.find((c) => !usados.includes(c));
      if (!libre) throw new Error("La partida está completa (4 personas).");
      tx.update(ref, { [`jugadoras.${uid}`]: jugadoraNueva(nombre, libre) });
    });
  }
  
  export function vigilarSala(codigo, alCambiar, alError) {
    return onSnapshot(
      doc(db, "salas", codigo),
      (snap) => alCambiar(snap.exists() ? snap.data() : null),
      alError
    );
  }
  
  export function salirDeSala(codigo, uid) {
    return updateDoc(doc(db, "salas", codigo), { [`jugadoras.${uid}`]: deleteField() });
  }
  
  export function borrarSala(codigo) {
    return deleteDoc(doc(db, "salas", codigo));
  }
  
  export function cambiarConfig(codigo, config) {
    return updateDoc(doc(db, "salas", codigo), { config });
  }
  
  export function empezarCarrera(codigo, preguntas) {
    return updateDoc(doc(db, "salas", codigo), { preguntas, estado: "jugando" });
  }
  
  export function guardarMiProgreso(codigo, uid, datos) {
    return updateDoc(doc(db, "salas", codigo), { [`jugadoras.${uid}`]: datos });
  }
  
  export function terminarCarrera(codigo) {
    return updateDoc(doc(db, "salas", codigo), { estado: "terminada" });
  }