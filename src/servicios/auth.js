import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
  } from "firebase/auth";
  import { auth } from "../firebase";
  import { marcarSesionPendiente, reclamarSesion } from "./sesion";
  import { ADMIN_UID } from "./accesos";

  export async function registrarse(email, password) {
    marcarSesionPendiente();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user.uid !== ADMIN_UID) await reclamarSesion(cred.user.uid);
    return cred;
  }

  export async function iniciarSesion(email, password) {
    marcarSesionPendiente();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user.uid !== ADMIN_UID) await reclamarSesion(cred.user.uid);
    return cred;
  }
  
  export function cerrarSesion() {
    return signOut(auth);
  }

  // envía un correo para crear una contraseña nueva (en español)
  export function recuperarContrasena(email) {
    auth.languageCode = "es";
    return sendPasswordResetEmail(auth, email);
  }
  
  // callback recibe el usuario (o null si no hay sesión). Devuelve una función
  // para dejar de escuchar, úsala en la limpieza de un useEffect.
  export function observarSesion(callback) {
    return onAuthStateChanged(auth, callback);
  }
  
  export function mensajeErrorAuth(codigo) {
    const mensajes = {
      "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
      "auth/invalid-email": "Ese correo no parece válido.",
      "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
      "auth/user-not-found": "No existe ninguna cuenta con ese correo.",
      "auth/wrong-password": "La contraseña no es correcta.",
      "auth/invalid-credential": "Correo o contraseña incorrectos.",
      "auth/missing-email": "Escribe tu correo para poder enviarte el enlace.",
      "auth/too-many-requests": "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar."
    };
    return mensajes[codigo] || "Ha ocurrido un error. Inténtalo de nuevo.";
  }