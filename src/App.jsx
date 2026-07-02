import { useEffect, useState } from "react";
import { cargarPreguntas } from "./cargarPreguntas";
import portada from "./assets/portada.jpeg";

const CLAVE_STATS = "opo_stats_v1";

// 📌 Array de frases de bienvenida — añade aquí nuevas cuando quieras
const FRASES_BIENVENIDA = [
  "venimos de personas que con la poesía cambiaron el mundo",
  "me declaro aprendiz imperecedera",
  "el conocimiento también se construye en sociedad"
];

export default function App() {
  const [preguntasBase, setPreguntasBase] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [pantalla, setPantalla] = useState("landing"); // 👈 ahora arranca en landing
  const [mensaje, setMensaje] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [cantidad, setCantidad] = useState(20);

  // 👈 se elige una sola vez al abrir la app (inicializador perezoso)
  const [frase] = useState(
    () => FRASES_BIENVENIDA[Math.floor(Math.random() * FRASES_BIENVENIDA.length)]
  );

  useEffect(() => {
    async function init() {
      const datos = await cargarPreguntas();
      setPreguntasBase(datos);
    }
    init();
  }, []);

  const pregunta = preguntas[indice];

  const stats = obtenerStats();
  const totalRespondidas = Object.values(stats).reduce(
    (a, b) => a + (b.veces || 0),
    0
  );
  const totalAciertos = Object.values(stats).reduce(
    (a, b) => a + (b.aciertos || 0),
    0
  );

  const porcentaje = totalRespondidas
    ? Math.round((totalAciertos / totalRespondidas) * 100)
    : 0;

  function volverMenu() {
    setPantalla("inicio");
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
  }

  function mezclar(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function prepararPregunta(p) {
    const respuestas = p.respuestas.map((r, i) => ({
      texto: r,
      indexOriginal: i
    }));

    const mezcladas = respuestas.sort(() => Math.random() - 0.5);

    const nuevaCorrecta = mezcladas.findIndex(
      (r) => r.indexOriginal === p.correcta
    );

    return {
      ...p,
      respuestas: mezcladas.map(r => r.texto),
      correcta: nuevaCorrecta
    };
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

  function iniciar(tipo = "normal", lista = preguntasBase) {
    let base = [...lista];

    if (tipo === "errores") {
      base = obtenerPreguntasDebiles(base);
    }

    base = mezclar(base)
      .slice(0, cantidad)
      .map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
    setPantalla("quiz");
  }

  // 📝 crear simulacro oficial
  function iniciarSimulacro() {
    const grupo1 = preguntasBase.filter(
      p => Number(p.grupo) === 1
    );

    const resto = preguntasBase.filter(
      p => Number(p.grupo) !== 1
    );

    const preguntasGrupo1 = mezclar(grupo1).slice(0, 10);
    const preguntasResto = mezclar(resto).slice(0, 90);

    const examen = [
      ...preguntasGrupo1,
      ...preguntasResto
    ];

    const examenFinal = mezclar(examen).map(prepararPregunta);

    setPreguntas(examenFinal);
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
    setPantalla("simulacro");
  }

  function iniciarBloque(lista) {
    const base = mezclar(lista)
      .slice(0, cantidad)
      .map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
    setPantalla("quiz");
  }

  function obtenerPreguntasDebiles(lista) {
    const stats = obtenerStats();

    const muyOlvidadas = [];
    const pendientes = [];
    const recuperadas = [];

    lista.forEach((p) => {
      const s = stats[String(p.id)];

      if (!s) return;

      if (s.errores >= 3) {
        muyOlvidadas.push(p);
      }
      else if (s.errores > s.aciertos) {
        pendientes.push(p);
      }
      else if (
        s.aciertos >= s.errores &&
        s.errores > 0
      ) {
        recuperadas.push(p);
      }
    });

    return [
      ...muyOlvidadas,
      ...pendientes,
      ...recuperadas
    ];
  }

  const pendientesErrores = obtenerPreguntasDebiles(preguntasBase).length;

  function comprobar(index) {
    const esCorrecta = index === pregunta.correcta;

    registrarRespuesta(pregunta, esCorrecta);

    if (esCorrecta) {
      setMensaje("✅ Correcto");
      setAciertos((a) => a + 1);
    } else {
      setMensaje("❌ Incorrecto");
    }

    setMostrar(true);
  }

  function siguiente() {
    setMensaje("");
    setMostrar(false);

    if (indice + 1 < preguntas.length) {
      setIndice((i) => i + 1);
    } else {
      setPantalla("resultado");
    }
  }

  // 🌸 PANTALLA DE BIENVENIDA (LANDING)
  if (pantalla === "landing") {
    return (
      <div style={styles.landingContainer}>
        <img
          src={portada}
          alt="Asistontas"
          style={styles.landingImage}
        />

        <div style={styles.landingOverlay}>
          <p style={styles.landingFrase}>"{frase}"</p>

          <button
            onClick={() => setPantalla("inicio")}
            style={styles.landingButton}
          >
            Empezar a estudiar
          </button>
        </div>
      </div>
    );
  }

  // 🟣 MENÚ PRINCIPAL
  if (pantalla === "inicio") {
    const bloques = agruparPorBloques(preguntasBase);

    return (
      <div style={styles.menuContainer}>
        <style>{`
          .menu-btn {
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .menu-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 22px rgba(0,0,0,0.12);
          }
          .menu-btn:active {
            transform: translateY(0) scale(0.98);
          }
          .cantidad-pill {
            transition: all 0.2s ease;
          }
          .bloque-chip {
            transition: all 0.2s ease;
          }
          .bloque-chip:hover {
            background: #efe8da;
            transform: translateY(-1px);
          }
        `}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Menú principal</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.progressCard}>
          <div style={styles.progressTextRow}>
            <span style={styles.progressLabel}>Progreso global</span>
            <span style={styles.progressValue}>{porcentaje}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div
              style={{ ...styles.progressFill, width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <div style={styles.cantidadRow}>
          <span style={styles.cantidadLabel}>Nº de preguntas</span>
          <div style={styles.cantidadGroup}>
            {[20, 50, 100].map((n) => (
              <button
                key={n}
                className="cantidad-pill"
                onClick={() => setCantidad(n)}
                style={{
                  ...styles.cantidadPill,
                  ...(cantidad === n ? styles.cantidadPillActiva : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          className="menu-btn"
          onClick={() => iniciar("normal")}
          style={{ ...styles.menuButton, ...styles.btnPeach }}
        >
          📖 Estudio general
        </button>

        <button
          className="menu-btn"
          onClick={iniciarSimulacro}
          style={{ ...styles.menuButton, ...styles.btnPurple }}
        >
          📝 Simulacro oficial
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("errores")}
          style={{ ...styles.menuButton, ...styles.btnPink }}
        >
          ⭐ Repasar errores ({pendientesErrores})
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("estadisticas")}
          style={{ ...styles.menuButton, ...styles.btnOlive }}
        >
          📊 Estadísticas
        </button>

        <h3 style={styles.bloquesTitle}>Por bloques</h3>

        <div style={styles.bloquesGrid}>
          {Object.keys(bloques).map((b) => (
            <button
              key={b}
              className="bloque-chip"
              onClick={() => iniciarBloque(bloques[b])}
              style={styles.bloqueChip}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ⭐ REPASAR ERRORES
  if (pantalla === "errores") {

    const stats = obtenerStats();

    const muyOlvidadas = [];
    const pendientes = [];
    const recuperadas = [];

    preguntasBase.forEach((p) => {

      const s = stats[String(p.id)];

      if (!s) return;

      if (s.errores >= 3) {
        muyOlvidadas.push(p);
      }

      else if (s.errores > s.aciertos) {
        pendientes.push(p);
      }

      else if (
        s.aciertos >= s.errores &&
        s.errores > 0
      ) {
        recuperadas.push(p);
      }

    });

    return (
      <div style={styles.container}>

        <h1>⭐ Repasar errores</h1>

        <div style={{
          border:"1px solid #ddd",
          padding:15,
          marginTop:10,
          borderRadius:10
        }}>
          <h3>
            🔴 Muy olvidadas ({muyOlvidadas.length})
          </h3>

          <p>
            Estas preguntas viven de alquiler en tu cabeza 👀
          </p>

          <button
            style={styles.button}
            onClick={() => iniciarBloque(muyOlvidadas)}
          >
            Repasar
          </button>

        </div>


        <div style={{
          border:"1px solid #ddd",
          padding:15,
          marginTop:10,
          borderRadius:10
        }}>
          <h3>
            🟡 Pendientes ({pendientes.length})
          </h3>

          <p>
            Aún te la están colando 😅
          </p>

          <button
            style={styles.button}
            onClick={() => iniciarBloque(pendientes)}
          >
            Repasar
          </button>

        </div>


        <div style={{
          border:"1px solid #ddd",
          padding:15,
          marginTop:10,
          borderRadius:10
        }}>
          <h3>
            🟢 Recuperadas ({recuperadas.length})
          </h3>

          <p>
            Antes daban guerra, ahora tiemblan 💪
          </p>

          <button
            style={styles.button}
            onClick={() => iniciarBloque(recuperadas)}
          >
            Repasar
          </button>

        </div>

        <button
          onClick={volverMenu}
          style={styles.button}
        >
          ⬅ Volver
        </button>

      </div>
    );
  }

  // 📊 ESTADÍSTICAS
  if (pantalla === "estadisticas") {

    const statsGuardadas = obtenerStats();
    const bloques = {};

    Object.values(statsGuardadas).forEach((dato) => {
      const bloque = dato.bloque || "Sin bloque";

      if (!bloques[bloque]) {
        bloques[bloque] = {
          respondidas: 0,
          aciertos: 0
        };
      }

      bloques[bloque].respondidas += dato.veces || 0;
      bloques[bloque].aciertos += dato.aciertos || 0;
    });

    function mensajeBloque(p) {

      if (p >= 90)
        return "🔥 ¿Necesitas una plaza o sustituir al tribunal?";

      if (p >= 75)
        return "😎 En esto estás sobrada";

      if (p >= 60)
        return "🙂 Vas bien, pero aún hay preguntas que te vacilan";

      if (p >= 40)
        return "⚠️ Este tema te está haciendo una llave de judo";

      if (p >= 20)
        return "🍺 Deja la cerveza y estudia, que este tema lo estás viendo menos que Stevie Wonder";

      return "🚨 Si este tema sale en el examen toca invocar fuerzas superiores";
    }

    const ordenados = Object.entries(bloques)
      .map(([nombre, datos]) => ({
        nombre,
        porcentaje: datos.respondidas
          ? Math.round(
              (datos.aciertos /
              datos.respondidas) * 100
            )
          : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    return (
      <div style={styles.container}>

        <h1>📊 Estadísticas</h1>

        {ordenados.length === 0 ? (

          <p>
            Todavía no has respondido preguntas 😅
          </p>

        ) : (

          <>
            {ordenados.map((b) => (
              <div
                key={b.nombre}
                style={{
                  border: "1px solid #ddd",
                  padding: 10,
                  marginTop: 10,
                  borderRadius: 10
                }}
              >
                <h3>{b.nombre}</h3>

                <p>{b.porcentaje}% aciertos</p>

                <p>{mensajeBloque(b.porcentaje)}</p>

              </div>
            ))}
          </>

        )}

        <button
          onClick={volverMenu}
          style={styles.button}
        >
          ⬅ Volver
        </button>

      </div>
    );
  }

  // 🟣 QUIZ (y también SIMULACRO, que usa la misma vista)
  if ((pantalla === "quiz" || pantalla === "simulacro") && pregunta) {
    return (
      <div style={styles.container}>
        <button onClick={volverMenu} style={styles.button}>
          ⬅ Menú
        </button>

        <p>
          Pregunta {indice + 1} / {preguntas.length}
        </p>

        <h3>{pregunta.pregunta}</h3>

        <p style={{ fontSize: 12 }}>{pregunta.tema}</p>

        {pregunta.respuestas.map((r, i) => {
          let bg = "#fff";

          if (mostrar) {
            bg = i === pregunta.correcta ? "#d4edda" : "#f8d7da";
          }

          return (
            <button
              key={i}
              onClick={() => comprobar(i)}
              disabled={mostrar}
              style={{ ...styles.button, background: bg }}
            >
              {r}
            </button>
          );
        })}

        {mostrar && (
          <>
            <p>{mensaje}</p>

            {(() => {
              const s = obtenerStats()[String(pregunta.id)];

              if (!s) return null;

              if (s.errores >= 5) {
                return (
                  <p>
                    💀 Esta pregunta te persigue desde hace tiempo...
                  </p>
                );
              }

              if (s.errores >= 3) {
                return (
                  <p>
                    👀 Ya os estáis viendo demasiado tú y esta pregunta
                  </p>
                );
              }

              if (
                s.aciertos >= s.errores &&
                s.errores > 0
              ) {
                return (
                  <p>
                    🏆 Recuperada. Antes te ganaba ella.
                  </p>
                );
              }

              return null;
            })()}

            <p style={{ fontSize: 13 }}>
              <b>Explicación:</b> {pregunta.explicacion}
            </p>

            <button onClick={siguiente} style={styles.button}>
              Siguiente →
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Fin del bloque</h2>

      <p>
        Aciertos: {aciertos} / {preguntas.length}
      </p>

      <button onClick={volverMenu} style={styles.button}>
        Volver al menú
      </button>
    </div>
  );
}

function obtenerStats() {
  return JSON.parse(localStorage.getItem(CLAVE_STATS)) || {};
}

function guardarStats(stats) {
  localStorage.setItem(CLAVE_STATS, JSON.stringify(stats));
}

function registrarRespuesta(pregunta, correcta) {
  const stats = obtenerStats();
  const id = String(pregunta.id);

  if (!stats[id]) {
    stats[id] = {
      id,
      bloque: pregunta.bloque || "Sin bloque",
      aciertos: 0,
      errores: 0,
      veces: 0
    };
  }

  stats[id].veces += 1;

  if (correcta) {
    stats[id].aciertos += 1;
  } else {
    stats[id].errores += 1;
  }

  guardarStats(stats);
}

const styles = {
  container: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial",
    textAlign: "center"
  },
  button: {
    display: "block",
    width: "100%",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer"
  },

  // 🌸 estilos de la portada
  landingContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    margin: 0,
    overflow: "hidden",
    background: "#f5f1ea"
  },
  landingImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block"
  },
  landingOverlay: {
    position: "absolute",
    bottom: "6%",
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 24px",
    boxSizing: "border-box"
  },
  landingFrase: {
    fontFamily: "Arial",
    fontStyle: "italic",
    color: "#5a5147",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
    maxWidth: 320
  },
  landingButton: {
    padding: "16px 42px",
    borderRadius: 30,
    border: "none",
    background: "#e29aa0",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.18)"
  },

  // 🟣 estilos del menú principal
  menuContainer: {
    maxWidth: 480,
    margin: "0 auto",
    minHeight: "100vh",
    padding: "40px 20px 60px",
    fontFamily: "Arial",
    background: "linear-gradient(180deg, #faf7f2 0%, #f2ece0 100%)",
    boxSizing: "border-box"
  },
  menuHeader: {
    textAlign: "center",
    marginBottom: 28
  },
  menuTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#4a463f",
    margin: 0,
    letterSpacing: 0.5
  },
  menuUnderline: {
    width: 70,
    height: 4,
    borderRadius: 4,
    background: "linear-gradient(90deg, #cbb8e8, #e29aa0)",
    margin: "10px auto 0"
  },
  progressCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 20,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
  },
  progressTextRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 13,
    color: "#8a8578"
  },
  progressValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#4a463f"
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    background: "#eee6da",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    background: "linear-gradient(90deg, #f2b366, #e29aa0)",
    transition: "width 0.4s ease"
  },
  cantidadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22
  },
  cantidadLabel: {
    fontSize: 13,
    color: "#8a8578"
  },
  cantidadGroup: {
    display: "flex",
    gap: 6,
    background: "#fff",
    padding: 4,
    borderRadius: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  cantidadPill: {
    border: "none",
    background: "transparent",
    padding: "6px 14px",
    borderRadius: 16,
    fontSize: 13,
    color: "#8a8578",
    cursor: "pointer"
  },
  cantidadPillActiva: {
    background: "#e29aa0",
    color: "#fff",
    fontWeight: 700
  },
  menuButton: {
    display: "block",
    width: "100%",
    border: "none",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
    fontSize: 15,
    fontWeight: 600,
    color: "#4a463f",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  btnPeach: { background: "#f6d7ae" },
  btnPurple: { background: "#d9cdf0" },
  btnPink: { background: "#f3cdd2" },
  btnOlive: { background: "#d7dcc0" },
  bloquesTitle: {
    fontSize: 13,
    color: "#8a8578",
    margin: "22px 0 10px",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  bloquesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  bloqueChip: {
    border: "1px solid #e4ddcf",
    background: "#fff",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    color: "#4a463f",
    cursor: "pointer"
  }
};