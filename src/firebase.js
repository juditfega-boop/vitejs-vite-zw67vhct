import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8tbzt2Qi7VFPANoXKHhIYRVVhvwoGgM8",
  authDomain: "asistontas.firebaseapp.com",
  projectId: "asistontas",
  storageBucket: "asistontas.firebasestorage.app",
  messagingSenderId: "1096765291123",
  appId: "1:1096765291123:web:ad2da20cdf8b1386588806"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);