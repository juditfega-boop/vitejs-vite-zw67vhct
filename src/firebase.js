import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8tbzt2Qi7VFPANoXKHhIYRVVhvwoGgM8",
  authDomain: "asistontas.firebaseapp.com",
  projectId: "asistontas",
  storageBucket: "asistontas.firebasestorage.app",
  messagingSenderId: "1096765291123",
  appId: "1:1096765291123:web:ad2da20cdf8b1386588806"
};

const app = initializeApp(firebaseConfig);
// 📴 guarda en el móvil lo que se descarga de Firestore, para poder usarlo sin conexión.
// Solo una pestaña usa la copia guardada; si abres otra, esa trabaja directamente
// con la nube (así ninguna se queda bloqueada esperando a la otra).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
});
export const auth = getAuth(app);