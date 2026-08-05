import { useState } from "react";
import { styles } from "../estilos";

/**
 * Cuadro de búsqueda reutilizable para filtrar una lista de nombres de
 * bloque. No sustituye la selección de bloques (los chips), solo decide
 * cuáles se muestran. Uso: const visibles = useFiltroBloques(bloques, texto)
 */
export default function BuscadorBloques({ valor, onChange }) {
  return (
    <input
      type="text"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar bloque..."
      style={{ ...styles.nombreInput, marginBottom: 10 }}
    />
  );
}

function quitarAcentos(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filtrarBloques(bloques, texto) {
  if (!texto.trim()) return bloques;
  const t = quitarAcentos(texto.trim());
  return bloques.filter((b) => quitarAcentos(b).includes(t));
}