import { useEffect, useMemo, useState } from "react";
import { styles } from "../estilos";
import imagenCabecera from "../assets/kit/erre-que-erre-cabecera.png";
import iconoReloj from "../assets/kit/icono-cronometro-reloj.png";
import plantaFeliz from "../assets/kit/planta-resultado-feliz.png";
import plantaTriste from "../assets/kit/planta-resultado-triste.png";
import { separarApartados, trocear, normalizar, segundosMemorizar } from "./fichas";
import { obtenerNivelesErre, guardarNivelesErre } from "../servicios/progreso";

// 🎨 colores del cuaderno para acierto / fallo
const VERDE = "#e3ecd9";
const VERDE_BORDE = "#8fb89a";
const ROSA = "#f9e3e3";
const ROSA_BORDE = "#e2a3a9";

const NOMBRE_NIVEL = { 1: "Con pistas", 2: "Huecos", 3: "De memoria" };

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// texto con las palabras clave en negrita (para memorizar y para corregir)
function TextoConNegritas({ texto }) {
  return trocear(texto).map((p, i) =>
    p.clave ? <b key={i}>{p.valor}</b> : <span key={i}>{p.valor}</span>
  );
}

// 🔁 "Erre que erre" — practica UN artículo: memorizar → huecos → corregir y reintentar.
// Recibe el nodo del artículo tal cual viene del JSON del Explorador.
export default function ErreQueErre({ articulo, onVolver }) {
  // cada apartado con palabras clave es una ficha
  const apartados = useMemo(() => separarApartados(articulo.contenido), [articulo]);
  const fichas = useMemo(
    () =>
      apartados
        .map((a) => ({
          id: `${articulo.id}-${a.numero || 1}`,
          numero: a.numero,
          texto: a.texto,
          partes: trocear(a.texto)
        }))
        .filter((f) => f.partes.some((p) => p.clave)),
    [apartados, articulo]
  );

  const [fase, setFase] = useState("memorizar"); // memorizar | recordar | fin
  const [segundos, setSegundos] = useState(() => segundosMemorizar(apartados.length));
  const [indice, setIndice] = useState(0);
  const [niveles, setNiveles] = useState(() => obtenerNivelesErre());
  const [resultados, setResultados] = useState({}); // id → "perfecta" | "reintento" | "fallo"

  // ⏳ cuenta atrás para memorizar
  useEffect(() => {
    if (fase !== "memorizar") return;
    if (segundos <= 0) {
      setFase("recordar");
      return;
    }
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [fase, segundos]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fase, indice]);

  function terminarFicha(ficha, resultado) {
    const actual = niveles[ficha.id] || 1;
    const nuevo =
      resultado === "perfecta" ? Math.min(3, actual + 1) : resultado === "fallo" ? Math.max(1, actual - 1) : actual;
    const nuevos = { ...niveles, [ficha.id]: nuevo };
    setNiveles(nuevos);
    guardarNivelesErre(nuevos);
    setResultados((r) => ({ ...r, [ficha.id]: resultado }));

    if (indice + 1 < fichas.length) setIndice(indice + 1);
    else setFase("fin");
  }

  function repetir() {
    setResultados({});
    setIndice(0);
    setSegundos(segundosMemorizar(apartados.length));
    setFase("memorizar");
  }

  const cabecera = (
    <>
      <img
        src={imagenCabecera}
        alt="Erre que erre"
        style={{ width: "100%", maxWidth: 230, display: "block", margin: "0 auto 8px" }}
      />
      <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 0 }}>
        {articulo.label} · {articulo.resumen}
      </p>
    </>
  );

  if (fichas.length === 0) {
    return (
      <div style={styles.menuContainer}>
        {cabecera}
        <div style={styles.configCard}>
          <p style={styles.configSubLabel}>Este artículo todavía no tiene fichas preparadas.</p>
        </div>
        <button onClick={onVolver} style={styles.linkVolver}>⬅ Volver al artículo</button>
      </div>
    );
  }

  // 👀 FASE 1: MEMORIZAR
  if (fase === "memorizar") {
    return (
      <div style={styles.menuContainer}>
        {cabecera}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "4px 0 14px" }}>
          <img src={iconoReloj} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
          <span style={{ fontSize: 20, fontWeight: 600, color: "#5b4a3a" }}>{segundos} s</span>
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Memoriza lo que está en negrita</p>
          {apartados.map((a) => (
            <p key={a.numero || 1} style={{ lineHeight: 1.65, color: "#4a4038", margin: "0 0 12px" }}>
              {a.numero && <b>{a.numero}. </b>}
              <TextoConNegritas texto={a.texto} />
            </p>
          ))}
        </div>

        <button onClick={() => setFase("recordar")} style={styles.ctaButton}>
          Ya lo tengo
        </button>
        <button onClick={onVolver} style={styles.linkVolver}>⬅ Volver al artículo</button>
      </div>
    );
  }

  // ✍️ FASE 2: RECORDAR (una ficha cada vez)
  if (fase === "recordar") {
    const ficha = fichas[indice];
    const nivel = niveles[ficha.id] || 1;
    return (
      <div style={styles.menuContainer}>
        {cabecera}
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          Ficha {indice + 1} de {fichas.length}
          {ficha.numero ? ` · Apartado ${ficha.numero}` : ""} · {NOMBRE_NIVEL[nivel]}
        </p>
        <Ficha
          key={ficha.id}
          ficha={ficha}
          nivel={nivel}
          articulo={articulo}
          onTerminar={(r) => terminarFicha(ficha, r)}
        />
        <button onClick={onVolver} style={styles.linkVolver}>⬅ Salir</button>
      </div>
    );
  }

  // 🌱 FASE 3: FIN
  const perfectas = fichas.filter((f) => resultados[f.id] === "perfecta").length;
  const buenaRonda = perfectas >= Math.ceil(fichas.length / 2);
  return (
    <div style={styles.menuContainer}>
      {cabecera}
      <div style={{ ...styles.configCard, textAlign: "center" }}>
        <img
          src={buenaRonda ? plantaFeliz : plantaTriste}
          alt=""
          style={{ width: 90, height: 90, objectFit: "contain", display: "block", margin: "0 auto 8px" }}
        />
        <p style={styles.configCardTitle}>
          {perfectas} de {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"} a la primera
        </p>
        {fichas.map((f) => {
          const r = resultados[f.id];
          return (
            <p key={f.id} style={{ ...styles.configSubLabel, margin: "4px 0" }}>
              {f.numero ? `Apartado ${f.numero}` : articulo.label}:{" "}
              {r === "perfecta" ? "a la primera 🌿" : r === "reintento" ? "al segundo intento" : "a repasar"} ·
              nivel {NOMBRE_NIVEL[niveles[f.id] || 1].toLowerCase()}
            </p>
          );
        })}
      </div>
      <button onClick={repetir} style={styles.ctaButton}>
        🔁 Erre que erre: otra vez
      </button>
      <button onClick={onVolver} style={styles.linkVolver}>⬅ Volver al artículo</button>
    </div>
  );
}

// 🗂️ Una ficha: huecos (niveles 1 y 2) o escribir de memoria (nivel 3)
function Ficha({ ficha, nivel, articulo, onTerminar }) {
  const huecos = useMemo(
    () => ficha.partes.map((p, i) => (p.clave ? i : null)).filter((i) => i !== null),
    [ficha]
  );
  const banco = useMemo(() => mezclar(huecos.map((i) => ({ i, valor: ficha.partes[i].valor }))), [huecos, ficha]);

  const [respuestas, setRespuestas] = useState({}); // índice de la parte → texto
  const [asignados, setAsignados] = useState({}); // nivel 1: índice de la parte → posición en el banco
  const [textoLibre, setTextoLibre] = useState(""); // nivel 3
  const [intento, setIntento] = useState(1);
  const [corregido, setCorregido] = useState(null); // índice → true/false
  const [bloqueados, setBloqueados] = useState({}); // aciertos que ya no se tocan

  const comprobado = corregido !== null;
  const fallos = comprobado ? huecos.filter((i) => !corregido[i]) : [];
  const todoBien = comprobado && fallos.length === 0;
  const terminado = comprobado && (todoBien || intento === 2);

  // nivel 1: al pulsar una palabra del banco se coloca en el primer hueco vacío
  function elegirDelBanco(posicion) {
    const libre = huecos.find((i) => !respuestas[i] && !bloqueados[i]);
    if (libre === undefined) return;
    setRespuestas((r) => ({ ...r, [libre]: banco[posicion].valor }));
    setAsignados((a) => ({ ...a, [libre]: posicion }));
  }

  // nivel 1: al pulsar un hueco relleno, la palabra vuelve al banco
  function vaciarHueco(i) {
    if (comprobado || bloqueados[i]) return;
    setRespuestas((r) => ({ ...r, [i]: "" }));
    setAsignados((a) => {
      const copia = { ...a };
      delete copia[i];
      return copia;
    });
  }

  function comprobar() {
    const resultado = {};
    if (nivel === 3) {
      const escrito = normalizar(textoLibre);
      huecos.forEach((i) => {
        resultado[i] = escrito.includes(normalizar(ficha.partes[i].valor));
      });
    } else {
      huecos.forEach((i) => {
        resultado[i] = bloqueados[i] || normalizar(respuestas[i]) === normalizar(ficha.partes[i].valor);
      });
    }
    setCorregido(resultado);
  }

  function reintentar() {
    const nuevosBloqueados = { ...bloqueados };
    huecos.forEach((i) => {
      if (corregido[i]) nuevosBloqueados[i] = true;
    });
    setBloqueados(nuevosBloqueados);
    if (nivel !== 3) {
      setRespuestas((r) => {
        const copia = { ...r };
        fallos.forEach((i) => (copia[i] = ""));
        return copia;
      });
      setAsignados((a) => {
        const copia = { ...a };
        fallos.forEach((i) => delete copia[i]);
        return copia;
      });
    }
    setIntento(2);
    setCorregido(null);
  }

  function siguiente() {
    onTerminar(todoBien ? (intento === 1 ? "perfecta" : "reintento") : "fallo");
  }

  // estilo de cada hueco según el momento
  function estiloHueco(i) {
    const base = {
      display: "inline-block",
      minWidth: 70,
      padding: "2px 8px",
      margin: "2px 2px",
      borderRadius: 10,
      border: "1.5px dashed #d8cbb6",
      background: "#fffaf2",
      font: "inherit",
      color: "#4a4038",
      verticalAlign: "baseline"
    };
    if (bloqueados[i] || (comprobado && corregido[i])) {
      return { ...base, border: `1.5px solid ${VERDE_BORDE}`, background: VERDE };
    }
    if (comprobado && !corregido[i]) {
      return { ...base, border: `1.5px solid ${ROSA_BORDE}`, background: ROSA };
    }
    return base;
  }

  // la palabra correcta, al lado de un fallo
  function solucion(i) {
    if (!comprobado || corregido[i]) return null;
    return (
      <span style={{ color: "#b0676d", fontStyle: "italic", fontSize: 14 }}> → {ficha.partes[i].valor}</span>
    );
  }

  return (
    <>
      <div style={styles.configCard}>
        {nivel === 3 ? (
          <>
            <p style={styles.configCardTitle}>
              {articulo.label}
              {ficha.numero ? `.${ficha.numero}` : ""}
            </p>
            <p style={styles.configSubLabel}>
              Escribe lo que recuerdes de este {ficha.numero ? "apartado" : "artículo"}. No hace falta que sea
              literal: cuentan las palabras clave.
            </p>
            {!comprobado ? (
              <textarea
                value={textoLibre}
                onChange={(e) => setTextoLibre(e.target.value)}
                rows={6}
                style={{
                  ...styles.nombreInput,
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  lineHeight: 1.5
                }}
              />
            ) : (
              <p style={{ lineHeight: 1.75, color: "#4a4038" }}>
                {ficha.partes.map((p, i) =>
                  p.clave ? (
                    <span key={i} style={{ ...estiloHueco(i), minWidth: 0 }}>
                      {p.valor}
                    </span>
                  ) : (
                    <span key={i}>{p.valor}</span>
                  )
                )}
              </p>
            )}
          </>
        ) : (
          <p style={{ lineHeight: 2.1, color: "#4a4038", margin: 0 }}>
            {ficha.partes.map((p, i) => {
              if (!p.clave) return <span key={i}>{p.valor}</span>;
              if (nivel === 1) {
                return (
                  <span key={i}>
                    <button onClick={() => vaciarHueco(i)} style={{ ...estiloHueco(i), cursor: "pointer" }}>
                      {respuestas[i] || "\u00a0"}
                    </button>
                    {solucion(i)}
                  </span>
                );
              }
              return (
                <span key={i}>
                  <input
                    value={bloqueados[i] ? p.valor : respuestas[i] || ""}
                    onChange={(e) => setRespuestas((r) => ({ ...r, [i]: e.target.value }))}
                    disabled={comprobado || bloqueados[i]}
                    placeholder={`${p.valor.charAt(0)}…`}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{ ...estiloHueco(i), width: `${Math.max(5, p.valor.length + 1)}ch`, maxWidth: "100%" }}
                  />
                  {solucion(i)}
                </span>
              );
            })}
          </p>
        )}
      </div>

      {/* banco de palabras (nivel 1) */}
      {nivel === 1 && !comprobado && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "0 0 14px" }}>
          {banco.map((b, posicion) => {
            const usada = Object.values(asignados).includes(posicion);
            return (
              <button
                key={posicion}
                onClick={() => elegirDelBanco(posicion)}
                disabled={usada}
                style={{
                  ...styles.pillBtn,
                  opacity: usada ? 0.35 : 1,
                  cursor: usada ? "default" : "pointer"
                }}
              >
                {b.valor}
              </button>
            );
          })}
        </div>
      )}

      {comprobado && (
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          {todoBien
            ? intento === 1
              ? "🌿 ¡Perfecta a la primera!"
              : "🌱 Ahora sí. Erre que erre."
            : intento === 1
            ? `Te ${fallos.length === 1 ? "ha faltado 1 palabra" : `han faltado ${fallos.length} palabras`}. Míralas y vuelve a intentarlo.`
            : "Esta ficha volverá a salir con más pistas."}
        </p>
      )}

      {!comprobado && (
        <button onClick={comprobar} style={styles.ctaButton}>
          Comprobar
        </button>
      )}
      {comprobado && !terminado && (
        <button onClick={reintentar} style={styles.ctaButton}>
          Reintentar los fallos
        </button>
      )}
      {terminado && (
        <button onClick={siguiente} style={styles.ctaButton}>
          Siguiente →
        </button>
      )}
    </>
  );
}