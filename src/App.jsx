import { useEffect, useState } from "react";
import { cargarPreguntas } from "./cargarPreguntas";

const CLAVE_STATS = "opo_stats_v1";

export default function App() {
  const [preguntasBase, setPreguntasBase] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [pantalla, setPantalla] = useState("inicio");
  const [mensaje, setMensaje] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [cantidad, setCantidad] = useState(20);

  // 📚 cargar preguntas
  useEffect(() => {
    async function init() {
      const datos = await cargarPreguntas();
      setPreguntasBase(datos);
    }
    init();
  }, []);

  const pregunta = preguntas[indice];

  // 📊 stats globales
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

  // 🌱 MENÚ
  function volverMenu() {
    setPantalla("inicio");
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
  }

  // 🎲 mezclar preguntas
  function mezclar(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  // 🎲 preparar respuestas mezcladas
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

  // 📦 agrupar por bloques
  function agruparPorBloques(lista) {
    const bloques = {};

    lista.forEach((p) => {
      const b = p.bloque || "Sin bloque";
      if (!bloques[b]) bloques[b] = [];
      bloques[b].push(p);
    });

    return bloques;
  }

  // 🚀 iniciar sesión normal
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

  // 📦 iniciar por bloque
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

  // ⭐ preguntas débiles
  function obtenerPreguntasDebiles(lista) {
    const stats = obtenerStats();

    return lista.filter((p) => {
      const s = stats[String(p.id)];
      return s && s.errores > s.aciertos;
    });
  }

  // 🧠 comprobar respuesta
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

  // 🔵 INICIO
  if (pantalla === "inicio") {
    const bloques = agruparPorBloques(preguntasBase);

    return (
      <div style={styles.container}>
        <h1>📚 OpoSocial</h1>

        <p>📊 Progreso global: {porcentaje}%</p>

        <label>Número de preguntas:</label>
        <select
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <button onClick={() => iniciar("normal")} style={styles.button}>
          📖 Estudio general
        </button>

        <button onClick={() => iniciar("errores")} style={styles.button}>
          ⭐ Repasar errores
        </button>

        <h3>📦 Por bloques</h3>

        {Object.keys(bloques).map((b) => (
          <button
            key={b}
            onClick={() => iniciarBloque(bloques[b])}
            style={styles.button}
          >
            {b}
          </button>
        ))}
      </div>
    );
  }

  // 🟣 QUIZ
  if (pantalla === "quiz" && pregunta) {
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

  // 🟢 RESULTADO
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

/* 🧠 STORAGE */
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
      aciertos: 0,
      errores: 0,
      veces: 0
    };
  }

  stats[id].veces += 1;

  if (correcta) stats[id].aciertos += 1;
  else stats[id].errores += 1;

  guardarStats(stats);
}

/* 🎨 estilos */
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
  }
};