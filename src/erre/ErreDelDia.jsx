import { useMemo, useState } from "react";
import { styles } from "../estilos";
import dataConstitucion from "../explorador/data/constitucion.json";
import imagenCabecera from "../assets/kit/erre-que-erre-cabecera.png";
import ErreQueErre from "./ErreQueErre";
import { separarApartados, tieneClaves } from "./fichas";
import { obtenerNivelesErre } from "../servicios/progreso";

// todos los artículos (hojas del JSON) que tienen palabras clave marcadas
function articulosConFichas(nodo, lista = []) {
  const hijos = nodo.children || [];
  if (hijos.length === 0) {
    if (tieneClaves(nodo.contenido)) lista.push(nodo);
  } else {
    hijos.forEach((h) => articulosConFichas(h, lista));
  }
  return lista;
}

// nivel medio de un artículo (1 si nunca lo has practicado)
function nivelMedio(articulo, niveles) {
  const apartados = separarApartados(articulo.contenido);
  const valores = apartados.map((a) => niveles[`${articulo.id}-${a.numero || 1}`] || 1);
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

// un número que cambia cada día (para no proponer siempre el mismo artículo)
function semillaDeHoy(texto) {
  const d = new Date();
  const base = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${texto}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return h;
}

// 🔁 Erre que erre desde su tarjeta: te propone el artículo que menos dominas
export default function ErreDelDia({ volver, irAExplorar }) {
  const articulos = useMemo(() => articulosConFichas(dataConstitucion), []);
  const [saltos, setSaltos] = useState(0);
  const [empezado, setEmpezado] = useState(null);

  const propuesto = useMemo(() => {
    const niveles = obtenerNivelesErre();
    const ordenados = [...articulos].sort(
      (a, b) => nivelMedio(a, niveles) - nivelMedio(b, niveles) || semillaDeHoy(a.id) - semillaDeHoy(b.id)
    );
    return ordenados[saltos % Math.max(1, ordenados.length)];
  }, [articulos, saltos, empezado]);

  if (empezado) {
    return <ErreQueErre articulo={empezado} onVolver={() => setEmpezado(null)} />;
  }

  return (
    <div style={styles.menuContainer}>
      <img
        src={imagenCabecera}
        alt="Erre que erre"
        style={{ width: "100%", maxWidth: 230, display: "block", margin: "0 auto 8px" }}
      />
      <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 0 }}>
        Memoriza un artículo, rellena los huecos y repite hasta que salga solo.
      </p>

      {propuesto ? (
        <div style={styles.configCard}>
          <p style={{ ...styles.configSubLabel, margin: "0 0 4px" }}>Te propongo este artículo</p>
          <p style={styles.configCardTitle}>{propuesto.label}</p>
          <p style={{ color: "#4a4038", lineHeight: 1.5, margin: "0 0 14px" }}>{propuesto.resumen}</p>
          <button onClick={() => setEmpezado(propuesto)} style={styles.ctaButton}>
            Empezar
          </button>
          <button onClick={() => setSaltos((s) => s + 1)} style={styles.linkVolver}>
            Prefiero otro
          </button>
        </div>
      ) : (
        <div style={styles.configCard}>
          <p style={styles.configSubLabel}>Todavía no hay artículos con fichas preparadas.</p>
        </div>
      )}

      <button onClick={irAExplorar} style={styles.linkVolver}>
        Elegir el artículo en Explora la Constitución
      </button>
      <button onClick={volver} style={styles.linkVolver}>
        ⬅ Volver
      </button>
    </div>
  );
}
