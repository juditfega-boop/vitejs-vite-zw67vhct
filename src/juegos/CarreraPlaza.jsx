import { useState, useEffect } from "react";
import { styles, globalStyles } from "../estilos";
import video2Jugadoras from "../assets/carrera-video-2.mp4";
import video3Jugadoras from "../assets/carrera-video-3.mp4";
import video4Jugadoras from "../assets/carrera-video-4.mp4";
import heroCarreraPlaza from "../assets/kit/hero-carrera-plaza.png";
import iconoPersonas from "../assets/bookbrand/icono-brand-personas.png";
import iconoTurno from "../assets/bookbrand/icono-brand-turno.png";
import iconoTrofeo from "../assets/bookbrand/icono-brand-trofeo.png";

const CLAVE_HISTORIAL_JUEGO = "opo_juego_historial_v1";

const FRASES_MINIJUEGO = [
  "El comité técnico ha deliberado: alguien necesita repasar la Ley 😅",
  "Esta partida generaría un informe social muy interesante",
  "Nivel de coordinación de caso: mejorable",
  "Ander-Egg estaría tomando notas de esta sesión, y sugeriría que os pusieráis a estudiar",
  "Recordad: Debéis una cerveza a quién haya ganado",
  "La derivación de este grupo está clara: ¡Toca estudiar!"
];

// 🎬 posiciones medidas (top/left en %) de cada carril en el vídeo
const POSICIONES_VIDEO = {
  2: [
    { top: 15, left: 6 },
    { top: 32, left: 6 }
  ],
  3: [
    { top: 15, left: 6 },
    { top: 32, left: 6 },
    { top: 49, left: 6 }
  ],
  4: [
    { top: 15, left: 6 },
    { top: 32, left: 6 },
    { top: 49, left: 6 },
    { top: 66, left: 6 }
  ]
};

// 🔀 utilidades locales (copias de las de App.jsx, para no depender de él)
function mezclar(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function prepararPregunta(p) {
  const respuestas = p.respuestas.map((r, i) => ({ texto: r, indexOriginal: i }));
  const mezcladas = respuestas.sort(() => Math.random() - 0.5);
  const nuevaCorrecta = mezcladas.findIndex((r) => r.indexOriginal === p.correcta);
  return { ...p, respuestas: mezcladas.map((r) => r.texto), correcta: nuevaCorrecta };
}

function agruparPorBloques(lista) {
  const bloques = {};
  lista.forEach((p) => {
    const b = p.bloque || "Sin bloque";
    if (!bloques[b]) bloques[b] = [];
    bloques[b].push(p);
  });
  return bloques;
}

function formatearTiempo(segundosTotales) {
  const m = Math.floor(segundosTotales / 60);
  const s = segundosTotales % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function obtenerHistorialJuego() {
  return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_JUEGO)) || [];
}

function guardarPartidaHistorial(puntuaciones) {
  const historial = obtenerHistorialJuego();
  const maxAciertos = Math.max(...puntuaciones.map((p) => p.aciertos));
  const ganadoras = puntuaciones
    .filter((p) => p.aciertos === maxAciertos)
    .map((p) => p.nombre);
  const ganador = ganadoras.length > 1 ? "Empate" : ganadoras[0];

  const nuevaPartida = {
    fecha: new Date().toLocaleString(),
    jugadores: puntuaciones,
    ganador
  };

  const actualizado = [nuevaPartida, ...historial].slice(0, 20);
  localStorage.setItem(CLAVE_HISTORIAL_JUEGO, JSON.stringify(actualizado));
}

// 🏁 "Carrera por la Plaza" — componente independiente y autocontenido.
// Recibe por prop el banco de preguntas y la función para volver al menú principal.
export default function CarreraPlaza({ preguntasBase, setPantalla, volverMenu }) {
  const [vista, setVista] = useState("detalle"); // detalle|config|transicion|jugando|resultado|historial

  const [juegoNumJugadores, setJuegoNumJugadores] = useState(2);
  const [juegoNombres, setJuegoNombres] = useState(["Persona 1", "Persona 2"]);
  const [juegoTipo, setJuegoTipo] = useState("general");
  const [juegoBloquesSeleccionados, setJuegoBloquesSeleccionados] = useState([]);
  const [juegoNumPreguntas, setJuegoNumPreguntas] = useState(10);
  const [juegoCronometroActivo, setJuegoCronometroActivo] = useState(false);

  const [preguntasJuego, setPreguntasJuego] = useState([]);
  const [puntuacionesJuego, setPuntuacionesJuego] = useState([]);
  const [turnoActual, setTurnoActual] = useState(0);
  const [respuestaSeleccionadaJuego, setRespuestaSeleccionadaJuego] = useState(null);
  const [tiempoRestanteJuego, setTiempoRestanteJuego] = useState(null);
  const [piezasConfeti, setPiezasConfeti] = useState([]);
  const [fraseJuego, setFraseJuego] = useState("");
  const [inicioTurno, setInicioTurno] = useState(null);
  const [jugadoraExpandida, setJugadoraExpandida] = useState(null);
  const [mostrarNombresVideo, setMostrarNombresVideo] = useState(false);
  const [refrescoHistorial, setRefrescoHistorial] = useState(0);

  const totalTurnosJuego = juegoNumJugadores * juegoNumPreguntas;
  const jugadorActualIndice = turnoActual % juegoNumJugadores;
  const rondaActualJuego = Math.floor(turnoActual / juegoNumJugadores);
  const preguntaJuego =
    preguntasJuego[jugadorActualIndice] &&
    preguntasJuego[jugadorActualIndice][rondaActualJuego];

  function cambiarNumJugadoresJuego(n) {
    setJuegoNumJugadores(n);
    setJuegoNombres((prev) => {
      const nuevo = [...prev];
      while (nuevo.length < n) nuevo.push(`Jugadora ${nuevo.length + 1}`);
      return nuevo.slice(0, n);
    });
  }

  function actualizarNombreJugador(i, valor) {
    setJuegoNombres((prev) => {
      const copia = [...prev];
      copia[i] = valor;
      return copia;
    });
  }

  function toggleBloqueJuego(nombre) {
    setJuegoBloquesSeleccionados((prev) =>
      prev.includes(nombre) ? prev.filter((b) => b !== nombre) : [...prev, nombre]
    );
  }

  function eliminarPartidaHistorial(index) {
    const historial = obtenerHistorialJuego();
    historial.splice(index, 1);
    localStorage.setItem(CLAVE_HISTORIAL_JUEGO, JSON.stringify(historial));
    setRefrescoHistorial((v) => v + 1);
  }

  function vaciarHistorialJuego() {
    localStorage.setItem(CLAVE_HISTORIAL_JUEGO, JSON.stringify([]));
    setRefrescoHistorial((v) => v + 1);
  }

  function comenzarPartida() {
    let listaFuente = preguntasBase;

    if (juegoTipo === "bloques") {
      listaFuente = preguntasBase.filter((p) =>
        juegoBloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const totalNecesarias = juegoNumJugadores * juegoNumPreguntas;
    const pool = mezclar(listaFuente).slice(0, totalNecesarias).map(prepararPregunta);

    const porJugador = [];
    for (let j = 0; j < juegoNumJugadores; j++) {
      porJugador.push(pool.slice(j * juegoNumPreguntas, (j + 1) * juegoNumPreguntas));
    }

    setPreguntasJuego(porJugador);
    setPuntuacionesJuego(
      juegoNombres.slice(0, juegoNumJugadores).map((nombre) => ({
        nombre: nombre.trim() || "Persona",
        aciertos: 0,
        errores: 0,
        tiempoTotal: 0,
        fallos: []
      }))
    );
    setTurnoActual(0);
    setRespuestaSeleccionadaJuego(null);
    setJugadoraExpandida(null);
    setMostrarNombresVideo(false);
    setVista("transicion");
  }

  function comenzarTurno() {
    setRespuestaSeleccionadaJuego(null);
    setTiempoRestanteJuego(juegoCronometroActivo ? 60 : null);
    setInicioTurno(Date.now());
    setVista("jugando");
  }

  function responderJuego(i) {
    if (respuestaSeleccionadaJuego !== null || !preguntaJuego) return;

    setRespuestaSeleccionadaJuego(i);

    const esCorrecta = i === preguntaJuego.correcta;
    const tiempoUsado = inicioTurno ? Date.now() - inicioTurno : 0;

    setPuntuacionesJuego((prev) => {
      const copia = [...prev];
      const actual = copia[jugadorActualIndice];
      copia[jugadorActualIndice] = {
        ...actual,
        aciertos: actual.aciertos + (esCorrecta ? 1 : 0),
        errores: actual.errores + (esCorrecta ? 0 : 1),
        tiempoTotal: (actual.tiempoTotal || 0) + tiempoUsado,
        fallos: esCorrecta
          ? actual.fallos
          : [
              ...actual.fallos,
              {
                pregunta: preguntaJuego.pregunta,
                respuestaDada: preguntaJuego.respuestas[i],
                correcta: preguntaJuego.respuestas[preguntaJuego.correcta]
              }
            ]
      };
      return copia;
    });
  }

  function avanzarTurno() {
    const siguienteTurno = turnoActual + 1;

    if (siguienteTurno >= totalTurnosJuego) {
      finalizarJuego();
    } else {
      setTurnoActual(siguienteTurno);
      setRespuestaSeleccionadaJuego(null);
      setVista("transicion");
    }
  }

  function generarConfeti() {
    const colores = ["#f2b366", "#e29aa0", "#d9cdf0", "#d7dcc0", "#f3cdd2"];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      izquierda: Math.random() * 100,
      retraso: Math.random() * 0.6,
      duracion: 2.2 + Math.random() * 1.6,
      color: colores[i % colores.length],
      giro: Math.round(Math.random() * 360)
    }));
  }

  function finalizarJuego() {
    setTiempoRestanteJuego(null);
    setPiezasConfeti(generarConfeti());
    setFraseJuego(FRASES_MINIJUEGO[Math.floor(Math.random() * FRASES_MINIJUEGO.length)]);
    guardarPartidaHistorial(puntuacionesJuego);
    setMostrarNombresVideo(false);
    setVista("resultado");
  }

  // ⏱️ cuenta atrás del minijuego (1 min por turno, si el cronómetro está activo)
  useEffect(() => {
    if (vista !== "jugando" || !juegoCronometroActivo || tiempoRestanteJuego === null) return;

    if (tiempoRestanteJuego <= 0) {
      if (respuestaSeleccionadaJuego === null) {
        const tiempoUsado = inicioTurno ? Date.now() - inicioTurno : 60000;

        setPuntuacionesJuego((prev) => {
          const copia = [...prev];
          if (copia[jugadorActualIndice]) {
            const actual = copia[jugadorActualIndice];
            copia[jugadorActualIndice] = {
              ...actual,
              errores: actual.errores + 1,
              tiempoTotal: (actual.tiempoTotal || 0) + tiempoUsado,
              fallos: [
                ...actual.fallos,
                {
                  pregunta: preguntaJuego ? preguntaJuego.pregunta : "",
                  respuestaDada: "(sin responder a tiempo)",
                  correcta: preguntaJuego
                    ? preguntaJuego.respuestas[preguntaJuego.correcta]
                    : ""
                }
              ]
            };
          }
          return copia;
        });
      }
      avanzarTurno();
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestanteJuego((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, tiempoRestanteJuego, juegoCronometroActivo, turnoActual]);

// 🏁 DETALLE
if (vista === "detalle") {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.quizHeaderRow}>
        <button onClick={() => setPantalla("minijuegos")} style={styles.quizVolverBtn}>
          ⬅
        </button>
      </div>

      <div style={styles.menuHeader}>
        <span style={styles.juegoDetalleEmojiTitulo}>🏁</span>
        <h1 style={styles.menuTitle}>Carrera por la Plaza</h1>
        <div style={styles.menuUnderline} />
      </div>

      <img src={heroCarreraPlaza} alt="" style={styles.juegoDetalleHeroImg} />

      <div style={styles.configCard}>
          <div style={styles.juegoDetalleFila}>
            <img src={iconoPersonas} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>
              De 2 a 4 personas
              <br />
              Un solo dispositivo
            </p>
          </div>
          <div style={styles.juegoDetalleFila}>
            <img src={iconoTurno} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>Cada jugadora responde por turnos</p>
          </div>
          <div style={{ ...styles.juegoDetalleFila, borderBottom: "none" }}>
            <img src={iconoTrofeo} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>
              Gana quien consiga más aciertos y llegue primero a la meta
            </p>
          </div>
        </div>

      <button onClick={() => setVista("config")} style={styles.ctaButton}>
        🚩 Empezar carrera
      </button>

      <button onClick={() => setVista("historial")} style={styles.linkVolver}>
        🕓 Ver historial de partidas
      </button>

      <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
        🍃 Volver
      </button>
    </div>
  );
}

  // ⚙️ CONFIGURACIÓN
  if (vista === "config") {
    const bloquesDisponiblesJuego = Object.keys(agruparPorBloques(preguntasBase));

    let listaFuenteJuego = preguntasBase;
    if (juegoTipo === "bloques") {
      listaFuenteJuego = preguntasBase.filter((p) =>
        juegoBloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const necesariasJuego = juegoNumJugadores * juegoNumPreguntas;
    const disponiblesJuego = listaFuenteJuego.length;
    const hayPreguntasSuficientes = disponiblesJuego >= necesariasJuego;

    const puedeEmpezarJuego =
      (juegoTipo === "general" || juegoBloquesSeleccionados.length > 0) &&
      juegoNombres.slice(0, juegoNumJugadores).every((n) => n.trim().length > 0) &&
      hayPreguntasSuficientes;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Carrera por la Plaza</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Número de personas</p>
          <div style={styles.pillGroup}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => cambiarNumJugadoresJuego(n)}
                style={{
                  ...styles.pillBtn,
                  ...(juegoNumJugadores === n ? styles.pillBtnActiva : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Nombres</p>
          {juegoNombres.slice(0, juegoNumJugadores).map((nombre, i) => (
            <input
              key={i}
              type="text"
              value={nombre}
              onChange={(e) => actualizarNombreJugador(i, e.target.value)}
              placeholder={`Jugadora ${i + 1}`}
              style={styles.nombreInput}
            />
          ))}
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Preguntas</p>
          <div style={styles.pillGroup}>
            <button
              className="pill"
              onClick={() => setJuegoTipo("general")}
              style={{
                ...styles.pillBtn,
                ...(juegoTipo === "general" ? styles.pillBtnActiva : {})
              }}
            >
              General
            </button>
            <button
              className="pill"
              onClick={() => setJuegoTipo("bloques")}
              style={{
                ...styles.pillBtn,
                ...(juegoTipo === "bloques" ? styles.pillBtnActiva : {})
              }}
            >
              Por bloques
            </button>
          </div>

          {juegoTipo === "bloques" && (
            <div style={styles.bloquesGrid}>
              {bloquesDisponiblesJuego.map((b) => (
                <button
                  key={b}
                  className="bloque-chip"
                  onClick={() => toggleBloqueJuego(b)}
                  style={{
                    ...styles.bloqueChip,
                    ...(juegoBloquesSeleccionados.includes(b) ? styles.bloqueChipActiva : {})
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Preguntas por persona</p>
          <div style={styles.pillGroup}>
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => setJuegoNumPreguntas(n)}
                style={{
                  ...styles.pillBtn,
                  ...(juegoNumPreguntas === n ? styles.pillBtnActiva : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
          {!hayPreguntasSuficientes && (
            <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 8 }}>
              No hay preguntas suficientes para esta configuración
              ({disponiblesJuego} disponibles, se necesitan {necesariasJuego}).
              Baja el número de preguntas o elige más bloques.
            </p>
          )}
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Activar cronómetro (1 min / pregunta)</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={juegoCronometroActivo}
                onChange={() => setJuegoCronometroActivo((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button
          onClick={comenzarPartida}
          disabled={!puedeEmpezarJuego}
          style={{
            ...styles.ctaButton,
            ...(puedeEmpezarJuego ? {} : styles.ctaButtonDisabled)
          }}
        >
          Empezar partida
        </button>

        <button onClick={() => setVista("detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 🔄 TRANSICIÓN ENTRE JUGADORAS
  if (vista === "transicion") {
    const nombreActual = puntuacionesJuego[jugadorActualIndice]?.nombre || "Persona";

    return (
      <div style={styles.placeholderContainer}>
        <div style={styles.placeholderCard}>
          <div style={styles.placeholderEmoji}>📱</div>
          <h2>Ahora juega {nombreActual}</h2>
          <p style={styles.configSubLabel}>
            Pasa el dispositivo a {nombreActual} y pulsa comenzar cuando esté listo/a.
          </p>
          <p style={{ ...styles.configSubLabel, marginTop: 8 }}>
            Pregunta {rondaActualJuego + 1} / {juegoNumPreguntas}
          </p>
          <button onClick={comenzarTurno} style={styles.ctaButton}>
            Comenzar
          </button>
        </div>
      </div>
    );
  }

  // 🎮 TURNO EN CURSO
  if (vista === "jugando" && preguntaJuego) {
    const nombreActual = puntuacionesJuego[jugadorActualIndice]?.nombre || "Persona";

    return (
      <div style={styles.menuContainer}>
        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>👤 {nombreActual}</span>
          {juegoCronometroActivo && (
            <span style={styles.simTimer}>
              ⏱ {formatearTiempo(tiempoRestanteJuego || 0)}
            </span>
          )}
        </div>

        <p style={styles.configSubLabel}>
          Pregunta {rondaActualJuego + 1} / {juegoNumPreguntas}
        </p>

        <h3>{preguntaJuego.pregunta}</h3>

        {preguntaJuego.respuestas.map((r, i) => (
          <button
            key={i}
            onClick={() => responderJuego(i)}
            disabled={respuestaSeleccionadaJuego !== null}
            style={{
              ...styles.simRespuestaBtn,
              ...(respuestaSeleccionadaJuego === i ? styles.simRespuestaSeleccionada : {})
            }}
          >
            {r}
          </button>
        ))}

        {respuestaSeleccionadaJuego !== null && (
          <button onClick={avanzarTurno} style={styles.ctaButton}>
            Pasar al siguiente jugador
          </button>
        )}
      </div>
    );
  }

  // 🏆🎬 VÍDEO + RESULTADO (fusionados)
  if (vista === "resultado") {
    const videoSrc =
      juegoNumJugadores === 2 ? video2Jugadoras : juegoNumJugadores === 3 ? video3Jugadoras : video4Jugadoras;

    const ranking = [...puntuacionesJuego].sort((a, b) => {
      if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
      return (a.tiempoTotal || 0) - (b.tiempoTotal || 0);
    });

    const maxAciertos = ranking.length > 0 ? ranking[0].aciertos : 0;
    const minTiempoGanadoras =
      ranking.length > 0
        ? Math.min(...ranking.filter((j) => j.aciertos === maxAciertos).map((j) => j.tiempoTotal || 0))
        : 0;
    const ganadoras = ranking.filter(
      (j) => j.aciertos === maxAciertos && (j.tiempoTotal || 0) === minTiempoGanadoras
    );
    const hayEmpate = ganadoras.length > 1;
    const posiciones = POSICIONES_VIDEO[juegoNumJugadores] || [];

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        {piezasConfeti.map((p) => (
          <span
            key={p.id}
            className="confeti-pieza"
            style={{
              left: `${p.izquierda}%`,
              background: p.color,
              animationDelay: `${p.retraso}s`,
              animationDuration: `${p.duracion}s`,
              transform: `rotate(${p.giro}deg)`
            }}
          />
        ))}

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>🏆 Clasificación</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.videoResultadoWrap}>
          <video
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onTimeUpdate={(e) => {
              const v = e.target;
              if (v.currentTime >= 5 && !mostrarNombresVideo) {
                setMostrarNombresVideo(true);
              }
              if (v.duration && v.currentTime >= v.duration - 2) {
                v.pause();
              }
            }}
            style={styles.videoElementInline}
          />

          {mostrarNombresVideo &&
            ranking.map((j, i) =>
              posiciones[i] ? (
                <span
                  key={j.nombre + i}
                  style={{
                    ...styles.etiquetaNombreVideo,
                    top: `${posiciones[i].top}%`,
                    left: `${posiciones[i].left}%`
                  }}
                >
                  {j.nombre}
                </span>
              ) : null
            )}
        </div>

        <p style={{ textAlign: "center", fontWeight: 700, color: "#4a463f" }}>
          {hayEmpate
            ? `¡Empate entre ${ganadoras.map((g) => g.nombre).join(" y ")}!`
            : `🥇 Gana ${ganadoras[0]?.nombre}`}
        </p>

        <div style={styles.resultCard}>
          {ranking.map((j, i) => (
            <div key={j.nombre + i}>
              <button
                onClick={() => setJugadoraExpandida(jugadoraExpandida === i ? null : i)}
                style={styles.filaJugadoraBtn}
              >
                <span>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {j.nombre}
                </span>
                <b>
                  {j.aciertos} ✅ / {j.errores} ❌{" "}
                  {jugadoraExpandida === i ? "▲" : "▼"}
                </b>
              </button>

              {jugadoraExpandida === i && (
                <div style={styles.fallosWrap}>
                  {j.fallos.length === 0 ? (
                    <p style={styles.configSubLabel}>Sin fallos. Perfecto 🎯</p>
                  ) : (
                    j.fallos.map((f, k) => (
                      <div key={k} style={styles.falloItem}>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>{f.pregunta}</p>
                        <p style={{ color: "#c96a6a", margin: 0 }}>Respondió: {f.respuestaDada}</p>
                        <p style={{ color: "#6a9a6a", margin: 0 }}>Correcta: {f.correcta}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {fraseJuego && (
          <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 14 }}>
            {fraseJuego}
          </p>
        )}

        <button onClick={comenzarPartida} style={styles.ctaButton}>
          Jugar otra vez
        </button>

        <button onClick={() => setVista("historial")} style={styles.linkVolver}>
          🕓 Ver historial
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // 🕓 HISTORIAL
  if (vista === "historial") {
    const historial = obtenerHistorialJuego();
    void refrescoHistorial;

    function confirmarVaciarHistorial() {
      if (window.confirm("¿Borrar todo el historial de partidas? Esto no se puede deshacer.")) {
        vaciarHistorialJuego();
      }
    }

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Historial de partidas</h1>
          <div style={styles.menuUnderline} />
        </div>

        {historial.length === 0 ? (
          <p style={styles.configSubLabel}>Todavía no habéis jugado ninguna partida.</p>
        ) : (
          <>
            <button onClick={confirmarVaciarHistorial} style={styles.linkVolver}>
              🗑️ Vaciar historial
            </button>

            {historial.map((partida, i) => (
              <div key={i} style={styles.configCard}>
                <div style={styles.configRow}>
                  <p style={styles.configCardTitle}>{partida.fecha}</p>
                  <button
                    onClick={() => eliminarPartidaHistorial(i)}
                    title="Eliminar esta partida"
                    style={styles.borrarPartidaBtn}
                  >
                    🗑️
                  </button>
                </div>
                <p style={styles.configSubLabel}>
                  {partida.ganador === "Empate" ? "Resultado: empate" : `Ganadora: ${partida.ganador}`}
                </p>
                {partida.jugadores.map((j, k) => (
                  <div key={k} style={{ ...styles.resultRow, fontSize: 13 }}>
                    <span>{j.nombre}</span>
                    <b>
                      {j.aciertos} ✅ / {j.errores} ❌
                    </b>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        <button onClick={() => setVista("detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  return null;
}