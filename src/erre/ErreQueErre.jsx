import { useEffect, useMemo, useState } from "react";
import { styles } from "../estilos";
import imagenCabecera from "../assets/kit/erre-que-erre-cabecera.png";
import iconoReloj from "../assets/kit/icono-cronometro-reloj.png";
import plantaFeliz from "../assets/kit/planta-resultado-feliz.png";
import plantaTriste from "../assets/kit/planta-resultado-triste.png";
import { separarApartados, trocear, normalizar, segundosMemorizar, trocearClave, palabrasClave } from "./fichas";
import { obtenerNivelesErre, guardarNivelesErre } from "../servicios/progreso";
import { entrarEnCurva } from "../servicios/curva";

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
export default function ErreQueErre({ articulo, onVolver, modoRepaso = false, numeroTanda, onRepasoTerminado }) {
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

  const [fase, setFase] = useState(modoRepaso ? "recordar" : "memorizar"); // memorizar | recordar | fin
  const [segundos, setSegundos] = useState(() => segundosMemorizar(apartados.length));
  const [indice, setIndice] = useState(0);
  const [niveles, setNiveles] = useState(() => obtenerNivelesErre());
  const [resultados, setResultados] = useState({}); // id → "perfecta" | "reintento" | "fallo"
  const [subidas, setSubidas] = useState(0); // cuántas fichas han subido de nivel en esta ronda
  // 📌 el nivel de cada ficha al empezar la ronda (para saber si ya estaba en «De memoria»)
  const [nivelesRonda, setNivelesRonda] = useState(() => obtenerNivelesErre());

  // ✍️ «De memoria» es el artículo entero: solo se entra cuando TODOS los apartados están listos (nivel 3).
  // Mientras tanto, todos salen uno a uno con huecos (los que ya están listos, esperando a los demás).
  // En el repaso de la curva, siempre el artículo entero.
  const todasListas = fichas.every((f) => (nivelesRonda[f.id] || 1) === 3);
  const deMemoria = modoRepaso || todasListas ? fichas : [];
  const unaAUna = modoRepaso || todasListas ? [] : fichas;

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

  // 🌿 si lo has escrito todo de memoria y a la primera, entra en la curva del olvido
  useEffect(() => {
    if (fase !== "fin" || modoRepaso) return;
    const todasALaPrimera = fichas.every((f) => resultados[f.id] === "perfecta");
    const yaEnNivel3 = fichas.every((f) => (nivelesRonda[f.id] || 1) === 3);
    if (todasALaPrimera && yaEnNivel3) entrarEnCurva("erre", articulo.id).catch((e) => console.error(e));
  }, [fase]);

  // apunta el resultado de una o varias fichas y les sube o baja el nivel
  function anotar(lista) {
    setResultados((r) => {
      const copia = { ...r };
      lista.forEach(({ ficha, resultado }) => (copia[ficha.id] = resultado));
      return copia;
    });
    if (modoRepaso) return;
    const nuevos = { ...niveles };
    let suben = 0;
    lista.forEach(({ ficha, resultado }) => {
      const actual = nuevos[ficha.id] || 1;
      nuevos[ficha.id] =
        resultado === "perfecta" ? Math.min(3, actual + 1) : resultado === "fallo" ? Math.max(1, actual - 1) : actual;
      if (resultado === "perfecta" && actual < 3) suben += 1;
    });
    setNiveles(nuevos);
    guardarNivelesErre(nuevos);
    if (suben > 0) setSubidas((s) => s + suben);
  }

  function terminarFicha(ficha, resultado) {
    anotar([{ ficha, resultado }]);
    if (indice + 1 < unaAUna.length) setIndice(indice + 1);
    else if (deMemoria.length > 0) setIndice(unaAUna.length); // toca escribir de memoria
    else setFase("fin");
  }

  function terminarMemoria(lista) {
    anotar(lista);
    setFase("fin");
  }


  function repetir() {
    setNivelesRonda(niveles);
    setResultados({});
    setSubidas(0);
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
        <button onClick={onVolver} style={styles.linkVolver}><span className="hoja-volver"></span> Volver al artículo</button>
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
        <button onClick={onVolver} style={styles.linkVolver}><span className="hoja-volver"></span> Volver al artículo</button>
      </div>
    );
  }

  // ✍️ FASE 2: RECORDAR (primero una ficha cada vez; después, lo que va de memoria)
  if (fase === "recordar") {
    if (indice >= unaAUna.length) {
      return (
        <div style={styles.menuContainer}>
          {cabecera}
          <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
            {modoRepaso ? `Repaso ${numeroTanda} · ` : ""}De memoria · todo el artículo
          </p>
          <Memoria
            key={`memoria-${fase}`}
            fichas={deMemoria}
            apartados={modoRepaso ? apartados : null}
            onTerminar={terminarMemoria}
          />
          <button onClick={onVolver} style={styles.linkVolver}><span className="hoja-volver"></span> Salir</button>
        </div>
      );
    }


    const ficha = unaAUna[indice];
    // si ya está lista (nivel 3) pero espera a los demás apartados, sale con huecos
    const nivel = Math.min(2, niveles[ficha.id] || 1);
    return (
      <div style={styles.menuContainer}>
        {cabecera}
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          Ficha {indice + 1} de {unaAUna.length}
          {ficha.numero ? ` · Apartado ${ficha.numero}` : ""} · {NOMBRE_NIVEL[nivel]}
        </p>
        <Ficha key={ficha.id} ficha={ficha} nivel={nivel} onTerminar={(r) => terminarFicha(ficha, r)} />
        <button onClick={onVolver} style={styles.linkVolver}><span className="hoja-volver"></span> Salir</button>
      </div>
    );
  }


  // 🌱 FASE 3: FIN
  const perfectas = fichas.filter((f) => resultados[f.id] === "perfecta").length;
  const buenaRonda = perfectas >= Math.ceil(fichas.length / 2);
  // 🏁 lo has escrito todo de memoria y a la primera: ya no hay nivel que subir
  const dominado = perfectas === fichas.length && fichas.every((f) => (nivelesRonda[f.id] || 1) === 3);

  // 🔁 final de un repaso de la curva del olvido
  if (modoRepaso) {
    const hayFallo = fichas.some((f) => resultados[f.id] === "fallo");
    const resultadoCurva = perfectas === fichas.length ? "bien" : hayFallo ? "mal" : "casi";
    const textos = {
      bien: "Lo recuerdas. Volverá dentro de más tiempo.",
      casi: "Casi. Volverá dentro del mismo tiempo.",
      mal: "Se te estaba olvidando. Vuelve mañana, sin drama."
    };
    return (
      <div style={styles.menuContainer}>
        {cabecera}
        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <img
            src={resultadoCurva === "mal" ? plantaTriste : plantaFeliz}
            alt=""
            style={{ width: 90, height: 90, objectFit: "contain", display: "block", margin: "0 auto 8px" }}
          />
          <p style={styles.configCardTitle}>
            {perfectas} de {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"} a la primera
          </p>
          <p style={{ ...styles.configSubLabel, margin: 0 }}>{textos[resultadoCurva]}</p>
        </div>
        <button onClick={() => onRepasoTerminado(resultadoCurva)} style={styles.ctaButton}>
          Siguiente →
        </button>
      </div>
    );
  }

  function empezarDeCero() {
    const nuevos = { ...niveles };
    fichas.forEach((f) => (nuevos[f.id] = 1));
    setNiveles(nuevos);
    guardarNivelesErre(nuevos);
    setNivelesRonda(nuevos);
    setResultados({});
    setSubidas(0);
    setIndice(0);
    setSegundos(segundosMemorizar(apartados.length));
    setFase("memorizar");
  }
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
      {dominado ? (
        <>
          <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 0 }}>
          ¡Te lo sabes de memoria! Ya has superado los tres niveles y está en tu repaso para que no se te olvide.
          </p>
          <button onClick={empezarDeCero} style={styles.ctaButton}>
            🔄 Volver a empezar desde el nivel 1
          </button>
        </>
      ) : (
        <button onClick={repetir} style={styles.ctaButton}>
          {perfectas === fichas.length
            ? subidas > 0
              ? "⬆️ Sube de nivel"
              : "🌿 Repasar otra vez"
            : "🔁 Erre que erre: otra vez"}
        </button>
      )}
            {perfectas < fichas.length && (
              <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 8 }}>
                Cada ficha sube de nivel cuando la aciertas a la primera. Las demás se quedan en su nivel
                (o bajan si no las aciertas ni al segundo intento). ¡Erre que erre hasta acertarlas todas!
              </p>
            )}
      <button onClick={onVolver} style={styles.linkVolver}><span className="hoja-volver"></span> Volver al artículo</button>
    </div>
  );
}

// 🗂️ Una ficha con huecos: nivel 1 (eliges las palabras) o nivel 2 (las escribes, palabra a palabra)
function Ficha({ ficha, nivel, onTerminar }) {
  // piezas en orden: texto que ya viene puesto y huecos.
  // Nivel 1: un hueco por palabra clave. Nivel 2: un hueco por palabra ("y", "de", "la"… ya vienen puestas).
  const piezas = useMemo(() => {
    const lista = [];
    ficha.partes.forEach((p, i) => {
      if (!p.clave) {
        lista.push({ texto: p.valor });
      } else if (nivel === 1) {
        lista.push({ id: String(i), valor: p.valor });
      } else {
        trocearClave(p.valor).forEach((t, k) =>
          lista.push(t.escribir ? { id: `${i}.${k}`, valor: t.valor } : { texto: t.valor })
        );
      }
    });
    return lista;
  }, [ficha, nivel]);
  const huecos = useMemo(() => piezas.filter((p) => p.id !== undefined), [piezas]);
  const banco = useMemo(() => mezclar(huecos.map((h) => ({ id: h.id, valor: h.valor }))), [huecos]);

  const [respuestas, setRespuestas] = useState({}); // id del hueco → texto
  const [asignados, setAsignados] = useState({}); // nivel 1: id del hueco → posición en el banco
  const [intento, setIntento] = useState(1);
  const [corregido, setCorregido] = useState(null); // id → true/false
  const [bloqueados, setBloqueados] = useState({}); // aciertos que ya no se tocan

  const comprobado = corregido !== null;
  const fallos = comprobado ? huecos.filter((h) => !corregido[h.id]) : [];
  const todoBien = comprobado && fallos.length === 0;
  const terminado = comprobado && (todoBien || intento === 2);

  // nivel 1: al pulsar una palabra del banco se coloca en el primer hueco vacío
  function elegirDelBanco(posicion) {
    const libre = huecos.find((h) => !respuestas[h.id] && !bloqueados[h.id]);
    if (!libre) return;
    setRespuestas((r) => ({ ...r, [libre.id]: banco[posicion].valor }));
    setAsignados((a) => ({ ...a, [libre.id]: posicion }));
  }

  // nivel 1: al pulsar un hueco relleno, la palabra vuelve al banco
  function vaciarHueco(id) {
    if (comprobado || bloqueados[id]) return;
    setRespuestas((r) => ({ ...r, [id]: "" }));
    setAsignados((a) => {
      const copia = { ...a };
      delete copia[id];
      return copia;
    });
  }

  function comprobar() {
    const resultado = {};
    huecos.forEach((h) => {
      resultado[h.id] = bloqueados[h.id] || normalizar(respuestas[h.id]) === normalizar(h.valor);
    });
    setCorregido(resultado);
  }

  function reintentar() {
    const nuevosBloqueados = { ...bloqueados };
    huecos.forEach((h) => {
      if (corregido[h.id]) nuevosBloqueados[h.id] = true;
    });
    setBloqueados(nuevosBloqueados);
    setRespuestas((r) => {
      const copia = { ...r };
      fallos.forEach((h) => (copia[h.id] = ""));
      return copia;
    });
    setAsignados((a) => {
      const copia = { ...a };
      fallos.forEach((h) => delete copia[h.id]);
      return copia;
    });
    setIntento(2);
    setCorregido(null);
  }

  function siguiente() {
    onTerminar(todoBien ? (intento === 1 ? "perfecta" : "reintento") : "fallo");
  }

  // estilo de cada hueco según el momento
  function estiloHueco(id) {
    const base = {
      display: "inline-block",
      minWidth: nivel === 1 ? 70 : 0,
      padding: "2px 8px",
      margin: "2px 2px",
      borderRadius: 10,
      border: "1.5px dashed #d8cbb6",
      background: "#fffaf2",
      font: "inherit",
      color: "#4a4038",
      verticalAlign: "baseline"
    };
    if (bloqueados[id] || (comprobado && corregido[id])) {
      return { ...base, border: `1.5px solid ${VERDE_BORDE}`, background: VERDE };
    }
    if (comprobado && !corregido[id]) {
      return { ...base, border: `1.5px solid ${ROSA_BORDE}`, background: ROSA };
    }
    return base;
  }

  // la palabra correcta, al lado de un fallo
  function solucion(h) {
    if (!comprobado || corregido[h.id]) return null;
    return <span style={{ color: "#b0676d", fontStyle: "italic", fontSize: 14 }}> → {h.valor}</span>;
  }

  return (
    <>
      <div style={styles.configCard}>
        <p style={{ lineHeight: 2.1, color: "#4a4038", margin: 0 }}>
          {piezas.map((p, n) => {
            if (p.id === undefined) return <span key={n}>{p.texto}</span>;
            if (nivel === 1) {
              return (
                <span key={n}>
                  <button onClick={() => vaciarHueco(p.id)} style={{ ...estiloHueco(p.id), cursor: "pointer" }}>
                    {respuestas[p.id] || " "}
                  </button>
                  {solucion(p)}
                </span>
              );
            }
            return (
              <span key={n}>
                <input
                  value={bloqueados[p.id] ? p.valor : respuestas[p.id] || ""}
                  onChange={(e) => setRespuestas((r) => ({ ...r, [p.id]: e.target.value }))}
                  disabled={comprobado || bloqueados[p.id]}
                  placeholder={`${p.valor.charAt(0)}…`}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ ...estiloHueco(p.id), width: `${Math.max(4, p.valor.length + 2)}ch`, maxWidth: "100%" }}
                />
                {solucion(p)}
              </span>
            );
          })}
        </p>
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

// ✍️ De memoria (nivel 3): un solo recuadro, sin pistas. Al comprobar, el artículo sale
// por apartados con las palabras clave en verde (las has escrito) o en rosa (te han faltado).
// apartados: solo en el repaso, para poder mirar el artículo (y entonces cuenta como «casi»).
function Memoria({ fichas, apartados, onTerminar }) {
  const [texto, setTexto] = useState("");
  const [intento, setIntento] = useState(1);
  const [corregido, setCorregido] = useState(null); // "idFicha|idPalabra" → true/false
  const [alPrimero, setAlPrimero] = useState({}); // idFicha → la tenía entera en el primer intento
  const [viendo, setViendo] = useState(false); // el artículo está a la vista
  const [mirado, setMirado] = useState(false); // lo has mirado en algún momento


  // las palabras que cuentan de cada ficha (una a una, sin "y", "de", "la"…)
  const palabras = useMemo(
    () =>
      fichas.map((f) => ({
        ficha: f,
        lista: f.partes.flatMap((p, i) =>
          p.clave ? palabrasClave(p.valor).map((v, k) => ({ clave: `${f.id}|${i}.${k}`, valor: v })) : []
        )
      })),
    [fichas]
  );

  const comprobado = corregido !== null;
  const fichaBien = (f) => palabras.find((x) => x.ficha.id === f.id).lista.every((w) => corregido && corregido[w.clave]);
  const faltan = comprobado ? palabras.reduce((n, x) => n + x.lista.filter((w) => !corregido[w.clave]).length, 0) : 0;
  const todoBien = comprobado && faltan === 0;
  const terminado = comprobado && (todoBien || intento === 2);

  function comprobar() {
    const escrito = ` ${normalizar(texto)} `;
    const resultado = {};
    palabras.forEach((x) => x.lista.forEach((w) => (resultado[w.clave] = escrito.includes(` ${normalizar(w.valor)} `))));
    setCorregido(resultado);
    if (intento === 1) {
      const bien = {};
      palabras.forEach((x) => (bien[x.ficha.id] = x.lista.every((w) => resultado[w.clave])));
      setAlPrimero(bien);
    }
  }

  function reintentar() {
    setIntento(2);
    setCorregido(null);
  }

  function siguiente() {
    onTerminar(
      fichas.map((f) => ({
        ficha: f,
        resultado: alPrimero[f.id] && !mirado ? "perfecta" : fichaBien(f) ? "reintento" : "fallo"
      }))
    );
  }

  // una palabra de la corrección, en verde o en rosa
  function palabraCorregida(ok, valor, key) {
    return (
      <span
        key={key}
        style={{
          padding: "1px 5px",
          borderRadius: 7,
          background: ok ? VERDE : ROSA,
          border: `1.5px solid ${ok ? VERDE_BORDE : ROSA_BORDE}`
        }}
      >
        {valor}
      </span>
    );
  }

  return (
    <>
      <div style={styles.configCard}>
        {!comprobado ? (
          <>
            <p style={styles.configSubLabel}>
              Escribe todo el artículo. No hace falta que sea literal: cuentan las palabras clave.
            </p>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={10}
              autoCapitalize="sentences"
              style={{
                ...styles.nombreInput,
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5
              }}
            />
          </>
        ) : (
          fichas.map((f) => (
            <p key={f.id} style={{ lineHeight: 1.9, color: "#4a4038", margin: "0 0 12px" }}>
              {f.numero && <b style={{ color: "#7a62a8" }}>{f.numero}. </b>}
              {f.partes.map((p, i) => {
                if (!p.clave) return <span key={i}>{p.valor}</span>;
                let k = -1;
                return (
                  <span key={i}>
                    {trocearClave(p.valor).map((t, j) => {
                      if (!t.escribir) return <span key={j}>{t.valor}</span>;
                      k += 1;
                      return palabraCorregida(corregido[`${f.id}|${i}.${k}`], t.valor, j);
                    })}
                  </span>
                );
              })}
            </p>
          ))
        )}
      </div>

      {comprobado && (
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          {todoBien
            ? intento === 1
              ? "🌿 ¡Perfecto a la primera!"
              : "🌱 Ahora sí. Erre que erre."
            : intento === 1
            ? `Te ${faltan === 1 ? "ha faltado 1 palabra" : `han faltado ${faltan} palabras`} (en rosa). Míralas y vuelve a intentarlo: tu texto sigue ahí.`
            : "Lo que te ha faltado volverá a salir con más pistas."}
        </p>
      )}

{apartados && !comprobado && (
        <>
          {viendo && (
            <div style={{ ...styles.configCard, background: "#f1ecfa" }}>
              {apartados.map((a) => (
                <p key={a.numero || 1} style={{ lineHeight: 1.65, color: "#4a4038", margin: "0 0 10px" }}>
                  {a.numero && <b>{a.numero}. </b>}
                  <TextoConNegritas texto={a.texto} />
                </p>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setViendo((v) => !v);
              setMirado(true);
            }}
            style={styles.linkVolver}
          >
            {viendo ? "Ocultar el artículo" : "Ver el artículo"}
          </button>
          <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 0 }}>
            {mirado
              ? "Lo has mirado: este repaso contará como «casi» y volverá dentro del mismo tiempo."
              : "Si lo miras, este repaso contará como «casi»."}
          </p>
        </>
      )}

      {!comprobado && (
        <button onClick={comprobar} disabled={!texto.trim()} style={{ ...styles.ctaButton, ...(texto.trim() ? {} : styles.ctaButtonDisabled) }}>
          Comprobar
        </button>
      )}
      {comprobado && !terminado && (
        <button onClick={reintentar} style={styles.ctaButton}>
          Completar lo que falta
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
