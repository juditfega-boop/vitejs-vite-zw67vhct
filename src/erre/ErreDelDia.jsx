import { useEffect, useMemo, useState } from "react";
import { styles } from "../estilos";
import dataConstitucion from "../explorador/data/constitucion.json";
import imagenCabecera from "../assets/kit/erre-que-erre-cabecera.png";
import ErreQueErre from "./ErreQueErre";
import { separarApartados, tieneClaves } from "./fichas";
import { obtenerNivelesErre } from "../servicios/progreso";
import { leerCurva, apuntarRepaso, pendientesDeHoy, resumenProximos, TOPE_DIARIO } from "../servicios/curva";

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

// 🔁 Erre que erre desde su tarjeta: repaso de hoy (curva del olvido) + artículo nuevo
export default function ErreDelDia({ volver, irAExplorar }) {
  const articulos = useMemo(() => articulosConFichas(dataConstitucion), []);
  const porId = useMemo(() => Object.fromEntries(articulos.map((a) => [a.id, a])), [articulos]);
  const [saltos, setSaltos] = useState(0);
  const [empezado, setEmpezado] = useState(null);
  const [curva, setCurva] = useState(null);
  const [cola, setCola] = useState(null); // artículos de la tanda de repaso
  const [posCola, setPosCola] = useState(0);
  const [tandaHecha, setTandaHecha] = useState(false);

  function cargarCurva() {
    leerCurva()
      .then((c) => setCurva(c.erre || {}))
      .catch((e) => {
        console.error(e);
        setCurva({});
      });
  }

  useEffect(() => {
    cargarCurva();
  }, []);

  const propuesto = useMemo(() => {
    const niveles = obtenerNivelesErre();
    const ordenados = [...articulos].sort(
      (a, b) => nivelMedio(a, niveles) - nivelMedio(b, niveles) || semillaDeHoy(a.id) - semillaDeHoy(b.id)
    );
    return ordenados[saltos % Math.max(1, ordenados.length)];
  }, [articulos, saltos, empezado]);

  const pendientes = curva ? pendientesDeHoy(curva).filter((id) => porId[id]) : [];
  const deHoy = pendientes.slice(0, TOPE_DIARIO);
  const enCurva = curva ? Object.keys(curva).length : 0;
  const proximos = curva ? resumenProximos(curva) : null;

  function empezarTanda() {
    setCola(deHoy.map((id) => porId[id]));
    setPosCola(0);
    setTandaHecha(false);
  }

  async function siguienteDeTanda(resultado) {
    const art = cola[posCola];
    try {
      await apuntarRepaso("erre", art.id, resultado);
    } catch (e) {
      console.error(e);
    }
    if (posCola + 1 < cola.length) setPosCola(posCola + 1);
    else {
      setCola(null);
      setTandaHecha(true);
      cargarCurva();
    }
  }

  if (cola) {
    const art = cola[posCola];
    return (
      <ErreQueErre
        key={`${art.id}-${posCola}`}
        articulo={art}
        modoRepaso
        numeroTanda={`${posCola + 1} de ${cola.length}`}
        onRepasoTerminado={siguienteDeTanda}
        onVolver={() => {
          setCola(null);
          cargarCurva();
        }}
      />
    );
  }

  if (empezado) {
    return (
      <ErreQueErre
        articulo={empezado}
        onVolver={() => {
          setEmpezado(null);
          cargarCurva();
        }}
      />
    );
  }

  const fila = { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#6e6256", padding: "4px 0" };

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

      <div style={{ ...styles.configCard, background: "#efe7f7", textAlign: "center" }}>
        <p style={{ ...styles.configSubLabel, margin: 0, color: "#6b5a8c" }}>Lo que se te iba a olvidar</p>
        <p style={{ ...styles.configCardTitle, margin: "4px 0", color: "#4f3f6e" }}>Repaso de hoy</p>
        {curva === null ? (
          <p style={styles.configSubLabel}>Cargando…</p>
        ) : deHoy.length > 0 ? (
          <>
            <p style={{ ...styles.configSubLabel, marginTop: 0, color: "#6b5a8c" }}>
              {deHoy.length} {deHoy.length === 1 ? "artículo" : "artículos"}
              {pendientes.length > deHoy.length ? " (el resto, mañana)" : ""}
            </p>
            <button onClick={empezarTanda} style={styles.ctaButton}>
              Empezar
            </button>
          </>
        ) : tandaHecha ? (
          <p style={{ ...styles.configSubLabel, margin: 0 }}>Repaso de hoy hecho. Lo que se resistió vuelve mañana.</p>
        ) : enCurva > 0 ? (
          <p style={{ ...styles.configSubLabel, margin: 0 }}>Hoy no te toca repasar nada.</p>
        ) : (
          <p style={{ ...styles.configSubLabel, margin: 0 }}>
            Cuando te sepas un artículo de memoria (nivel 3 a la primera), entrará aquí para que no se te olvide.
          </p>
        )}
      </div>

      {proximos && enCurva > 0 && (
        <div style={styles.configCard}>
          <p style={{ ...styles.configCardTitle, marginTop: 0 }}>Próximos</p>
          <div style={fila}><span>Mañana</span><span>{proximos.manana}</span></div>
          <div style={fila}><span>Próximos 7 días</span><span>{proximos.semana}</span></div>
          <div style={fila}><span>Ya en la memoria larga</span><span>{proximos.larga}</span></div>
        </div>
      )}

      {propuesto ? (
        <div style={styles.configCard}>
          <p style={{ ...styles.configSubLabel, margin: "0 0 4px" }}>Practicar un artículo nuevo</p>
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