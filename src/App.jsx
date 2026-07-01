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

        <button onClick={iniciarSimulacro} style={styles.button}>
          📝 Simulacro oficial
        </button>

        <button
  onClick={() => setPantalla("errores")}
  style={styles.button}
>
  ⭐ Repasar errores ({pendientesErrores})
</button>

        <button onClick={() => setPantalla("estadisticas")} style={styles.button}>
          📊 Estadísticas
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
      bloques[bloque].respondidas += dato.veces || 0;
      bloques[bloque].aciertos += dato.aciertos || 0;

    };

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
  }
};
