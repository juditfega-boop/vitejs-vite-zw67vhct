import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
  } from "firebase/auth";
  import { auth } from "../firebase";
  
  export function registrarse(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  
  export function iniciarSesion(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  export function cerrarSesion() {
    return signOut(auth);
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
      "auth/invalid-credential": "Correo o contraseña incorrectos."
    };
    return mensajes[codigo] || "Ha ocurrido un error. Inténtalo de nuevo.";
  }