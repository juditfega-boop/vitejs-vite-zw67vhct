import { useState, useEffect } from "react";
import { registrarRespuesta } from "../servicios/progreso";
import { styles } from "../estilos";
import iconoSimAciertos from "../assets/kit/icono-fin-aciertos.png";
import iconoSimErrores from "../assets/kit/icono-sim-errores.png";
import iconoSimBlancos from "../assets/kit/icono-sim-blancos.png";
import iconoSimTiempo from "../assets/kit/icono-sim-tiempo.png";
import heroSimulacroCompletado from "../assets/kit/hero-simulacro-completado.png";
import iconoHistorial from "../assets/bookbrand/icono-brand-historial.png";
import iconoPapelera from "../assets/bookbrand/icono-brand-papelera.png";

const DURACION_SIMULACRO_MINUTOS = 100;
const CLAVE_HISTORIAL_SIMULACRO = "opo_simulacro_historial_v1";

function obtenerHistorialSimulacro() {
  return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_SIMULACRO)) || [];
}

function guardarSimulacroHistorial(resultado) {
  const historial = obtenerHistorialSimulacro();
  const nuevo = [
    {
      fecha: new Date().toLocaleString(),
      nota: resultado.nota,
      aciertos: resultado.aciertos,
      errores: resultado.errores,
      blancos: resultado.blancos,
      tiempo: resultado.tiempo
    },
    ...historial
  ].slice(0, 50);
  localStorage.setItem(CLAVE_HISTORIAL_SIMULACRO, JSON.stringify(nuevo));
}

function eliminarSimulacroHistorial(index) {
  const historial = obtenerHistorialSimulacro();
  historial.splice(index, 1);
  localStorage.setItem(CLAVE_HISTORIAL_SIMULACRO, JSON.stringify(historial));
}

function vaciarHistorialSimulacro() {
  localStorage.setItem(CLAVE_HISTORIAL_SIMULACRO, JSON.stringify([]));
}

function mezclar(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function prepararPregunta(p) {
  const respuestas = p.respuestas.map((r, i) => ({ texto: r, indexOriginal: i }));
  const mezcladas = respuestas.sort(() => Math.random() - 0.5);
  const nuevaCorrecta = mezcladas.findIndex((r) => r.indexOriginal === p.correcta);
  return { ...p, respuestas: mezcladas.map((r) => r.texto), correcta: nuevaCorrecta };
}

function formatearTiempo(segundosTotales) {
  const m = Math.floor(segundosTotales / 60);
  const s = segundosTotales % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Simulacro({ preguntasBase, volverMenu }) {
  const [vista, setVista] = useState("intro"); // intro|examen|resultado

  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [tiempoRestanteSimulacro, setTiempoRestanteSimulacro] = useState(null);
  const [respuestasSimulacro, setRespuestasSimulacro] = useState([]);
  const [horaInicioSimulacro, setHoraInicioSimulacro] = useState(null);
  const [resultadoSimulacro, setResultadoSimulacro] = useState(null);
  const [mostrarValoracion, setMostrarValoracion] = useState(false);
  const [refrescoHistorialSimulacro, setRefrescoHistorialSimulacro] = useState(0);
  const [repasoIndice, setRepasoIndice] = useState(0);
  const [repasoRespuestaSeleccionada, setRepasoRespuestaSeleccionada] = useState(null);
  const [repasoMostrar, setRepasoMostrar] = useState(false);
  const pregunta = preguntas[indice];

  useEffect(() => {
    if (vista !== "examen" || tiempoRestanteSimulacro === null) return;

    if (tiempoRestanteSimulacro <= 0) {
      finalizarSimulacro();
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestanteSimulacro((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, tiempoRestanteSimulacro]);

  function iniciarSimulacro() {
    const grupo1 = preguntasBase.filter((p) => Number(p.grupo) === 1);
    const resto = preguntasBase.filter((p) => Number(p.grupo) !== 1);

    const preguntasGrupo1 = mezclar(grupo1).slice(0, 10);
    const preguntasResto = mezclar(resto).slice(0, 90);

    const examen = [...preguntasGrupo1, ...preguntasResto];
    const examenFinal = mezclar(examen).map(prepararPregunta);

    setPreguntas(examenFinal);
    setIndice(0);
    setRespuestasSimulacro(new Array(examenFinal.length).fill(null));
    setTiempoRestanteSimulacro(DURACION_SIMULACRO_MINUTOS * 60);
    setHoraInicioSimulacro(Date.now());
    setResultadoSimulacro(null);
    setVista("examen");
  }

  function seleccionarRespuestaSimulacro(i) {
    setRespuestasSimulacro((prev) => {
      const copia = [...prev];
      copia[indice] = copia[indice] === i ? null : i;
      return copia;
    });
  }

  function finalizarSimulacro() {
    let aciertosF = 0;
    let erroresF = 0;
    let blancosF = 0;
    const bloquesTally = {};
    const fallidas = [];

    preguntas.forEach((p, i) => {
      const r = respuestasSimulacro[i];
      const bloque = p.bloque || "Sin bloque";
      if (!bloquesTally[bloque]) bloquesTally[bloque] = { total: 0, aciertos: 0 };
      bloquesTally[bloque].total += 1;

      if (r === null || r === undefined) {
        blancosF++;
        fallidas.push({
          pregunta: p.pregunta,
          respuestas: p.respuestas,
          correcta: p.correcta,
          explicacion: p.explicacion
        });
      } else if (r === p.correcta) {
        aciertosF++;
        bloquesTally[bloque].aciertos += 1;
        registrarRespuesta(p, true);
      } else {
        erroresF++;
        registrarRespuesta(p, false);
        fallidas.push({
          pregunta: p.pregunta,
          respuestas: p.respuestas,
          correcta: p.correcta,
          explicacion: p.explicacion
        });
      }
    });

    const notaBruta = aciertosF * 1 - erroresF * (1 / 3);
    const nota = Math.max(0, notaBruta);

    const segundosEmpleados = horaInicioSimulacro
      ? Math.round((Date.now() - horaInicioSimulacro) / 1000)
      : 0;

    const bloquesOrdenados = Object.entries(bloquesTally)
      .map(([nombre, datos]) => ({
        nombre,
        porcentaje: datos.total ? Math.round((datos.aciertos / datos.total) * 100) : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    const mejoresBloques = bloquesOrdenados.filter((b) => b.porcentaje >= 60);
    const peoresBloques = bloquesOrdenados.filter((b) => b.porcentaje < 40);

    const historialPrevio = obtenerHistorialSimulacro();
    const notaAnterior = historialPrevio.length > 0 ? Number(historialPrevio[0].nota) : null;

    const resultado = {
      nota: nota.toFixed(2),
      aciertos: aciertosF,
      errores: erroresF,
      blancos: blancosF,
      tiempo: formatearTiempo(segundosEmpleados),
      mejoresBloques,
      peoresBloques,
      notaAnterior,
      intento: historialPrevio.length + 1,
      fallidas
    };

    guardarSimulacroHistorial(resultado);

    setResultadoSimulacro(resultado);
    setTiempoRestanteSimulacro(null);
    setMostrarValoracion(false);
    setRepasoIndice(0);
    setRepasoRespuestaSeleccionada(null);
    setRepasoMostrar(false);
    setVista("resultado");
  }

  // 📝 INTRO
  if (vista === "intro") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Simulacro oficial</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <div style={styles.resultRow}>
            <span>📋 Nº de preguntas</span>
            <b>100</b>
          </div>
          <div style={styles.resultRow}>
            <span>⏱ Tiempo total</span>
            <b>{DURACION_SIMULACRO_MINUTOS} min</b>
          </div>
          <div style={styles.resultRow}>
            <span style={styles.resultRowLabel}>
              <img src={iconoSimAciertos} alt="" style={styles.resultRowIcono} />
              Acierto
            </span>
            <b>+1 punto</b>
          </div>
          <div style={styles.resultRow}>
            <span style={styles.resultRowLabel}>
              <img src={iconoSimErrores} alt="" style={styles.resultRowIcono} />
              Error
            </span>
            <b>−1/3 punto</b>
          </div>
          <div style={{ ...styles.resultRow, borderBottom: "none" }}>
            <span>⬜ En blanco</span>
            <b>No penaliza</b>
          </div>
        </div>

        <p style={styles.configSubLabel}>
          Puedes dejar preguntas en blanco y volver a ellas más adelante, mientras te quede tiempo.
        </p>

        <button onClick={iniciarSimulacro} style={styles.ctaButton}>
          Comenzar simulacro
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // 📝 EXAMEN EN CURSO
  if (vista === "examen" && pregunta) {
    const respondidas = respuestasSimulacro.filter((r) => r !== null && r !== undefined).length;

    return (
      <div style={styles.menuContainer}>
        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>⏱ {formatearTiempo(tiempoRestanteSimulacro || 0)}</span>
          <span style={styles.configSubLabel}>
            {respondidas} / {preguntas.length} respondidas
          </span>
          <button onClick={finalizarSimulacro} style={styles.simFinalizarBtn}>
            Finalizar
          </button>
        </div>

        <div style={styles.simDotsWrap}>
          {preguntas.map((p, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              style={{
                ...styles.simDot,
                ...(respuestasSimulacro[i] !== null && respuestasSimulacro[i] !== undefined
                  ? styles.simDotRespondida
                  : {}),
                ...(i === indice ? styles.simDotActual : {})
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <p style={styles.configSubLabel}>
          Pregunta {indice + 1} / {preguntas.length}
        </p>

        <h3>{pregunta.pregunta}</h3>

        {pregunta.respuestas.map((r, i) => (
          <button
            key={i}
            onClick={() => seleccionarRespuestaSimulacro(i)}
            style={{
              ...styles.simRespuestaBtn,
              ...(respuestasSimulacro[indice] === i ? styles.simRespuestaSeleccionada : {})
            }}
          >
            {r}
          </button>
        ))}

        <div style={styles.simNavRow}>
          <button
            disabled={indice === 0}
            onClick={() => setIndice((i) => i - 1)}
            style={{
              ...styles.simNavBtn,
              background: "#fff",
              color: "#4a463f",
              opacity: indice === 0 ? 0.4 : 1
            }}
          >
            ← Anterior
          </button>

          {indice + 1 < preguntas.length ? (
            <button
              onClick={() => setIndice((i) => i + 1)}
              style={{ ...styles.simNavBtn, ...styles.btnPeach }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={finalizarSimulacro}
              style={{ ...styles.simNavBtn, ...styles.btnPurple }}
            >
              Finalizar simulacro
            </button>
          )}
        </div>
      </div>
    );
  }

// 🏁 RESULTADO
if (vista === "resultado" && resultadoSimulacro) {
  const { nota, aciertos, errores, blancos, tiempo, mejoresBloques, peoresBloques, notaAnterior, intento } =
    resultadoSimulacro;

  let mensajeComparacion;
  if (notaAnterior === null) {
    mensajeComparacion = "Es tu primer simulacro completo. ¡Enhorabuena por terminarlo!";
  } else if (Number(nota) > notaAnterior) {
    mensajeComparacion = `Has mejorado respecto a tu simulacro anterior (${notaAnterior.toFixed(2)}).`;
  } else if (Number(nota) < notaAnterior) {
    mensajeComparacion = `Has bajado un poco respecto a tu simulacro anterior (${notaAnterior.toFixed(2)}).`;
  } else {
    mensajeComparacion = "Has mantenido la misma nota que tu simulacro anterior.";
  }

  return (
    <div style={styles.menuContainer}>
      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>Simulacro completado</h1>
        <div style={styles.menuUnderline} />
      </div>

      <img src={heroSimulacroCompletado} alt="" style={styles.simHeroImg} />

      <div style={{ textAlign: "center" }}>
        <span style={styles.simIntentoPill}>Intento nº {intento}</span>
      </div>

      <div style={styles.simNotaCard}>
        <p style={styles.simNotaEtiqueta}>Nota final</p>
        <p style={styles.simNotaValor}>{nota}</p>
        <p style={styles.simNotaSobre}>sobre 10</p>
      </div>

      <div style={styles.simStatGrid}>
        <div style={styles.simStatCard}>
          <img src={iconoSimAciertos} alt="" style={styles.simStatIcono} />
          <p style={styles.simStatValor}>{aciertos}</p>
          <p style={styles.simStatEtiqueta}>Aciertos</p>
        </div>
        <div style={styles.simStatCard}>
          <img src={iconoSimErrores} alt="" style={styles.simStatIcono} />
          <p style={styles.simStatValor}>{errores}</p>
          <p style={styles.simStatEtiqueta}>Errores</p>
        </div>
        <div style={styles.simStatCard}>
          <img src={iconoSimBlancos} alt="" style={styles.simStatIcono} />
          <p style={styles.simStatValor}>{blancos}</p>
          <p style={styles.simStatEtiqueta}>En blanco</p>
        </div>
        <div style={styles.simStatCard}>
          <img src={iconoSimTiempo} alt="" style={styles.simStatIcono} />
          <p style={styles.simStatValor}>{tiempo}</p>
          <p style={styles.simStatEtiqueta}>Tiempo empleado</p>
        </div>
      </div>

      <div style={styles.simValoracionCard}>
        <button onClick={() => setMostrarValoracion((v) => !v)} style={styles.simValoracionToggle}>
          <span>🌿 Valoración de este simulacro</span>
          <span>{mostrarValoracion ? "▲" : "▼"}</span>
        </button>

        {mostrarValoracion && (
          <>
            <p style={styles.simValoracionTexto}>{mensajeComparacion}</p>

            <p style={styles.simValoracionListaTitulo}>Mejores bloques</p>
            {mejoresBloques.length === 0 ? (
              <p style={styles.simValoracionTexto}>
                Todavía no hay ningún bloque con un 60% o más de aciertos en este simulacro.
              </p>
            ) : (
              mejoresBloques.map((b) => (
                <p key={b.nombre} style={{ ...styles.simValoracionTexto, marginTop: 4 }}>
                  🌿 {b.nombre} — {b.porcentaje}%
                </p>
              ))
            )}

            <p style={styles.simValoracionListaTitulo}>Bloques a reforzar</p>
            {peoresBloques.length === 0 ? (
              <p style={styles.simValoracionTexto}>
                Ningún bloque por debajo del 40% de aciertos. ¡Buen trabajo!
              </p>
            ) : (
              peoresBloques.map((b) => (
                <p key={b.nombre} style={{ ...styles.simValoracionTexto, marginTop: 4 }}>
                  🍂 {b.nombre} — {b.porcentaje}%
                </p>
              ))
            )}
          </>
        )}
      </div>

      {(errores > 0 || blancos > 0) && (
          <button
            onClick={() => {
              setRepasoIndice(0);
              setRepasoRespuestaSeleccionada(null);
              setRepasoMostrar(false);
              setVista("repaso");
            }}
            style={styles.simRepasoBoton}
          >
            📖 Repasar preguntas falladas
          </button>
        )}

<button onClick={() => setVista("historial")} style={styles.linkVolver}>
          <span style={styles.botonIconoTextoRow}>
            <img src={iconoHistorial} alt="" style={styles.iconoInlinePequeno} />
            Ver historial de simulacros
          </span>
        </button>

        <button onClick={volverMenu} style={styles.ctaButton}>
          Volver al menú
        </button>
      </div>
    );
  }

  // 📖 REPASO DE PREGUNTAS FALLADAS
  if (vista === "repaso") {
    const fallidas = resultadoSimulacro?.fallidas || [];
    const preguntaRepaso = fallidas[repasoIndice];

    if (!preguntaRepaso) {
      return (
        <div style={styles.menuContainer}>
          <div style={styles.menuHeader}>
            <h1 style={styles.menuTitle}>Repaso completado</h1>
            <div style={styles.menuUnderline} />
          </div>
          <p style={styles.configSubLabel}>
            Has repasado todas las preguntas falladas de este simulacro.
          </p>
          <button onClick={() => setVista("resultado")} style={styles.ctaButton}>
            Volver al resultado
          </button>
        </div>
      );
    }

    function comprobarRepaso(i) {
      setRepasoRespuestaSeleccionada(i);
      setRepasoMostrar(true);
    }

    function siguienteRepaso() {
      setRepasoRespuestaSeleccionada(null);
      setRepasoMostrar(false);
      setRepasoIndice((idx) => idx + 1);
    }

    return (
      <div style={styles.menuContainer}>
        <div style={styles.quizHeaderRow}>
          <button onClick={() => setVista("resultado")} style={styles.quizVolverBtn}>
            ⬅ Resultado
          </button>
        </div>

        <span style={styles.quizPreguntaTag}>
          Fallada {repasoIndice + 1} de {fallidas.length}
        </span>

        <div style={styles.quizPreguntaCard}>
          <p style={styles.quizPreguntaTexto}>{preguntaRepaso.pregunta}</p>
        </div>

        {preguntaRepaso.respuestas.map((r, i) => {
          let estadoEstilo = {};
          if (repasoMostrar) {
            if (i === preguntaRepaso.correcta) estadoEstilo = styles.quizRespuestaCorrecta;
            else if (i === repasoRespuestaSeleccionada) estadoEstilo = styles.quizRespuestaIncorrecta;
          }

          return (
            <button
              key={i}
              onClick={() => comprobarRepaso(i)}
              disabled={repasoMostrar}
              style={{ ...styles.quizRespuestaBtn, ...estadoEstilo }}
            >
              <span style={styles.quizRespuestaLetra}>{String.fromCharCode(65 + i)}</span>
              <span>{r}</span>
            </button>
          );
        })}

        {repasoMostrar && (
          <>
            <div style={styles.explicacionCaja}>
              <div style={styles.explicacionTituloRow}>
                <b>Explicación:</b>
              </div>
              <p style={{ margin: 0 }}>{preguntaRepaso.explicacion}</p>
            </div>

            <button onClick={siguienteRepaso} style={styles.ctaButton}>
              Siguiente →
            </button>
          </>
        )}
      </div>
    );
  }

  // 🕓 HISTORIAL DE SIMULACROS
if (vista === "historial") {
  const historial = obtenerHistorialSimulacro();
  void refrescoHistorialSimulacro;

  function confirmarVaciar() {
    if (window.confirm("¿Borrar todo el historial de simulacros? Esto no se puede deshacer.")) {
      vaciarHistorialSimulacro();
      setRefrescoHistorialSimulacro((v) => v + 1);
    }
  }

  function eliminarUno(i) {
    eliminarSimulacroHistorial(i);
    setRefrescoHistorialSimulacro((v) => v + 1);
  }

  return (
    <div style={styles.menuContainer}>
      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>Historial de simulacros</h1>
        <div style={styles.menuUnderline} />
      </div>

      {historial.length === 0 ? (
        <p style={styles.configSubLabel}>Todavía no has completado ningún simulacro.</p>
      ) : (
        <>
<button onClick={confirmarVaciar} style={styles.linkVolver}>
              <span style={styles.botonIconoTextoRow}>
                <img src={iconoPapelera} alt="" style={styles.iconoInlinePequeno} />
                Vaciar historial
              </span>
            </button>

          {historial.map((s, i) => (
            <div key={i} style={styles.configCard}>
<div style={styles.configRow}>
                  <p style={styles.configCardTitle}>{s.fecha}</p>
                  <button onClick={() => eliminarUno(i)} title="Eliminar este simulacro" style={styles.borrarPartidaBtn}>
                    <img src={iconoPapelera} alt="" style={styles.iconoInlinePequeno} />
                  </button>
                </div>
              <div style={{ ...styles.resultRow, fontSize: 13 }}>
                <span>Nota</span>
                <b>{s.nota} / 10</b>
              </div>
              <div style={{ ...styles.resultRow, fontSize: 13, borderBottom: "none" }}>
                  <span style={styles.inlineStatRow}>
                    <img src={iconoSimAciertos} alt="" style={styles.iconoInlinePequeno} /> {s.aciertos}
                    <img src={iconoSimErrores} alt="" style={styles.iconoInlinePequeno} /> {s.errores}
                    <img src={iconoSimBlancos} alt="" style={styles.iconoInlinePequeno} /> {s.blancos}
                  </span>
                  <span>⏱ {s.tiempo}</span>
                </div>
            </div>
          ))}
        </>
      )}

      <button onClick={() => setVista("resultado")} style={styles.linkVolver}>
        ⬅ Volver al resultado
      </button>
    </div>
  );
}

return null;
}