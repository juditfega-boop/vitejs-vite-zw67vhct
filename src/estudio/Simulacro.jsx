import { useState, useEffect } from "react";
import { registrarRespuesta } from "../servicios/progreso";
import { styles } from "../estilos";
import iconoSimAciertos from "../assets/kit/icono-fin-aciertos.png";
import iconoSimErrores from "../assets/kit/icono-sim-errores.png";
import iconoSimBlancos from "../assets/kit/icono-sim-blancos.png";
import iconoHojaBlanco from "../assets/kit/icono-hoja-blanco.png";
import iconoSimTiempo from "../assets/kit/icono-sim-tiempo.png";
import iconoExplicacion from "../assets/kit/icono-explicacion-libreta.png";
import heroSimulacroCompletado from "../assets/kit/hero-simulacro-completado.png";
import iconoHistorial from "../assets/bookbrand/icono-brand-historial.png";
import iconoPapelera from "../assets/bookbrand/icono-brand-papelera.png";
import { renderizarTextoConNegrita } from "../utils/renderizarTexto";
import iconoCronometro from "../assets/kit/icono-cronometro-reloj.png";
import iconoPlantita from "../assets/kit/icono-plantita-evolucion.png";
import iconoPausaBano from "../assets/bookbrand/icono-brand-pausa-bano.png";
import iconoLapizHoja from "../assets/bookbrand/icono-brand-lapiz-hoja.png";

const filaAviso = { ...{}, display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10 };
const iconoAviso = { width: 26, height: 26, objectFit: "contain", flexShrink: 0 };


const DURACION_SIMULACRO_MINUTOS = 100;
const DURACION_PAUSA_SEGUNDOS = 5 * 60;
const CLAVE_HISTORIAL_SIMULACRO = "opo_simulacro_historial_v1";

function obtenerHistorialSimulacro() {
  return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_SIMULACRO)) || [];
}

function guardarSimulacroHistorial(resultado) {
  const historial = obtenerHistorialSimulacro();
  const nuevo = [
    {
      id: resultado.id,
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
  const [borrado] = historial.splice(index, 1);
  localStorage.setItem(CLAVE_HISTORIAL_SIMULACRO, JSON.stringify(historial));
  if (borrado && borrado.id) {
    guardarRevisiones(obtenerRevisiones().filter((r) => r.id !== borrado.id));
  }
}

function vaciarHistorialSimulacro() {
  localStorage.setItem(CLAVE_HISTORIAL_SIMULACRO, JSON.stringify([]));
  localStorage.removeItem(CLAVE_REVISIONES_SIMULACRO);
}

// 🔍 revisión completa de los últimos simulacros (para repasarlos más tarde)
const CLAVE_REVISIONES_SIMULACRO = "opo_simulacro_revisiones_v1";
const MAX_REVISIONES = 5;

function obtenerRevisiones() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_REVISIONES_SIMULACRO)) || [];
  } catch {
    return [];
  }
}

function guardarRevisiones(lista) {
  try {
    localStorage.setItem(CLAVE_REVISIONES_SIMULACRO, JSON.stringify(lista.slice(0, MAX_REVISIONES)));
  } catch {}
}

function guardarRevisionNueva(revision) {
  guardarRevisiones([revision, ...obtenerRevisiones()]);
}

function actualizarProgresoRepaso(id, indice) {
  guardarRevisiones(obtenerRevisiones().map((r) => (r.id === id ? { ...r, repasoIndice: indice } : r)));
}

// Barajado justo (Fisher-Yates)
function mezclar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function prepararPregunta(p) {
  const respuestas = p.respuestas.map((r, i) => ({ texto: r, indexOriginal: i }));
  const mezcladas = mezclar(respuestas);
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
  const [enPausa, setEnPausa] = useState(false);
  const [pausaUsada, setPausaUsada] = useState(false);
  const [pausaRestante, setPausaRestante] = useState(DURACION_PAUSA_SEGUNDOS);
  const [revisionActiva, setRevisionActiva] = useState(null);
  const [revisionIndice, setRevisionIndice] = useState(0);
  const [volverDesdeRevision, setVolverDesdeRevision] = useState("resultado");
  const pregunta = preguntas[indice];

  useEffect(() => {
    if (vista !== "examen" || tiempoRestanteSimulacro === null || enPausa) return;

    if (tiempoRestanteSimulacro <= 0) {
      finalizarSimulacro();
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestanteSimulacro((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, tiempoRestanteSimulacro, enPausa]);

  // 🚻 cuenta atrás de la pausa (5 min, una sola vez por examen)
  useEffect(() => {
    if (!enPausa) return;
    if (pausaRestante <= 0) {
      setEnPausa(false);
      return;
    }
    const id = setTimeout(() => setPausaRestante((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [enPausa, pausaRestante]);

  // al cambiar de pregunta, la pantalla sube al enunciado
  useEffect(() => {
    if (vista === "examen") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [indice, vista]);

  function empezarPausa() {
    if (pausaUsada) return;
    setPausaUsada(true);
    setPausaRestante(DURACION_PAUSA_SEGUNDOS);
    setEnPausa(true);
  }

  function terminarPausa() {
    setEnPausa(false);
  }

  function confirmarFinalizar() {
    const sinResponder = respuestasSimulacro.filter((r) => r === null || r === undefined).length;
    const texto =
      sinResponder > 0
        ? `Te quedan ${sinResponder} preguntas sin responder. ¿Seguro que quieres entregar el examen?`
        : "¿Entregar el examen?";
    if (window.confirm(texto)) finalizarSimulacro();
  }

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
    setEnPausa(false);
    setPausaUsada(false);
    setPausaRestante(DURACION_PAUSA_SEGUNDOS);
    setRevisionActiva(null);
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

    // tiempo real de examen (sin contar la pausa)
    const segundosEmpleados =
      tiempoRestanteSimulacro !== null
        ? DURACION_SIMULACRO_MINUTOS * 60 - Math.max(0, tiempoRestanteSimulacro)
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

    const idRevision = Date.now();
    const revision = {
      id: idRevision,
      fecha: new Date().toLocaleString(),
      nota: nota.toFixed(2),
      repasoIndice: 0,
      preguntas: preguntas.map((p, i) => ({
        pregunta: p.pregunta,
        respuestas: p.respuestas,
        correcta: p.correcta,
        explicacion: p.explicacion,
        marcada: respuestasSimulacro[i] ?? null
      }))
    };
    resultado.id = idRevision;

    guardarSimulacroHistorial(resultado);
    guardarRevisionNueva(revision);
    setRevisionActiva(revision);

    setResultadoSimulacro(resultado);
    setTiempoRestanteSimulacro(null);
    setEnPausa(false);
    setMostrarValoracion(false);
    setRepasoIndice(0);
    setRepasoRespuestaSeleccionada(null);
    setRepasoMostrar(false);
    setVista("resultado");
  }

  function abrirRevision(rev, desde) {
    setRevisionActiva(rev);
    setRevisionIndice(0);
    setVolverDesdeRevision(desde);
    setVista("revision");
  }

  function abrirRepaso(rev, desde) {
    setRevisionActiva(rev);
    setRepasoIndice(rev.repasoIndice || 0);
    setRepasoRespuestaSeleccionada(null);
    setRepasoMostrar(false);
    setVolverDesdeRevision(desde);
    setVista("repaso");
  }

  function reiniciarRepaso() {
    setRepasoIndice(0);
    setRepasoRespuestaSeleccionada(null);
    setRepasoMostrar(false);
    actualizarProgresoRepaso(revisionActiva.id, 0);
    setRevisionActiva((r) => ({ ...r, repasoIndice: 0 }));
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
            <span style={styles.resultRowLabel}>
              <img src={iconoExplicacion} alt="" style={styles.resultRowIcono} />
              Nº de preguntas
            </span>
            <b>100</b>
          </div>
          <div style={styles.resultRow}>
            <span style={styles.resultRowLabel}>
              <img src={iconoSimTiempo} alt="" style={styles.resultRowIcono} />
              Tiempo total
            </span>
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
            <span style={styles.resultRowLabel}>
              <img src={iconoHojaBlanco} alt="" style={styles.resultRowIcono} />
              En blanco
            </span>
            <b>No penaliza</b>
          </div>
        </div>

        <div style={{ ...styles.configCard, background: "#f3eefa" }}>
          <p style={styles.configCardTitle}>Antes de empezar</p>
          <div style={filaAviso}>
            <img src={iconoPlantita} alt="" style={iconoAviso} />
            <p style={{ ...styles.configSubLabel, margin: 0 }}>
              Asegúrate de estar en un espacio tranquilo y sin interrupciones.
            </p>
          </div>
          <div style={filaAviso}>
            <img src={iconoCronometro} alt="" style={iconoAviso} />
            <p style={{ ...styles.configSubLabel, margin: 0 }}>
              El cronómetro no se para, igual que en el examen real.
            </p>
          </div>
          <div style={filaAviso}>
            <img src={iconoPausaBano} alt="" style={iconoAviso} />
            <p style={{ ...styles.configSubLabel, margin: 0 }}>
              Tienes una única pausa de 5 minutos (por ejemplo, para ir al baño). Durante la pausa
              el reloj se congela y la pregunta se oculta.
            </p>
          </div>
          <div style={filaAviso}>
            <img src={iconoLapizHoja} alt="" style={iconoAviso} />
            <p style={{ ...styles.configSubLabel, margin: 0 }}>
              Puedes dejar preguntas en blanco y volver a ellas más adelante, mientras te quede tiempo.
            </p>
          </div>
        </div>

        <button onClick={iniciarSimulacro} style={styles.ctaButton}>
          ¡¡Comenzar simulacro!!
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

    if (enPausa) {
      return (
        <div style={styles.menuContainer}>
          <div style={{ ...styles.configCard, textAlign: "center", marginTop: 40 }}>
          <img
              src={iconoPausaBano}
              alt=""
              style={{ width: 120, height: 120, objectFit: "contain", display: "block", margin: "0 auto 10px" }}
            />
            <p style={styles.configCardTitle}>Pausa</p>
            <p style={{ fontSize: 40, fontWeight: 700, color: "#5b4a3a", margin: "6px 0 10px" }}>
              {formatearTiempo(pausaRestante)}
            </p>
            <p style={styles.configSubLabel}>
              El examen está congelado en {formatearTiempo(tiempoRestanteSimulacro || 0)}. Cuando
              acabe la pausa, seguirá solo.
            </p>
            <button onClick={terminarPausa} style={{ ...styles.ctaButton, marginTop: 16 }}>
              He vuelto, seguir con el examen
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.menuContainer}>
        <div style={styles.simHeaderBar}>
        <span style={styles.simTimer}>
            <img src={iconoCronometro} alt="" style={styles.iconoInlinePequeno} /> {formatearTiempo(tiempoRestanteSimulacro || 0)}
          </span>
          <span style={styles.configSubLabel}>
            {respondidas} / {preguntas.length} respondidas
          </span>
          <button onClick={confirmarFinalizar} style={styles.simFinalizarBtn}>
            Finalizar
          </button>
        </div>

        {!pausaUsada && (
          <button onClick={empezarPausa} style={styles.linkVolver}>
            <span style={styles.botonIconoTextoRow}>
              <img src={iconoPausaBano} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
              Usar mi pausa de 5 minutos
            </span>
          </button>
        )}

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
          key={`${indice}-${i}`}
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
              onClick={confirmarFinalizar}
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

      {revisionActiva && (
        <button onClick={() => abrirRevision(revisionActiva, "resultado")} style={styles.simRepasoBoton}>
          Revisar examen
        </button>
      )}

      {revisionActiva && (errores > 0 || blancos > 0) && (
        <button
          onClick={() => abrirRepaso(revisionActiva, "resultado")}
          style={{ ...styles.simRepasoBoton, marginTop: 10 }}
        >
          📖 Repasar falladas una a una
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

  // 📖 REPASO DE FALLADAS (una a una, con progreso guardado)
  if (vista === "repaso" && revisionActiva) {
    const fallidas = revisionActiva.preguntas.filter((p) => p.marcada !== p.correcta);
    const preguntaRepaso = fallidas[repasoIndice];
    const volverA = () =>
      setVista(volverDesdeRevision === "resultado" && resultadoSimulacro ? "resultado" : "historial");

    if (!preguntaRepaso) {
      return (
        <div style={styles.menuContainer}>
          <div style={styles.menuHeader}>
            <h1 style={styles.menuTitle}>Repaso completado</h1>
            <div style={styles.menuUnderline} />
          </div>
          <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
            Has repasado las {fallidas.length} preguntas falladas o en blanco de este simulacro.
          </p>
          <button onClick={reiniciarRepaso} style={styles.ctaButton}>
            Empezar el repaso de nuevo
          </button>
          <button onClick={volverA} style={styles.linkVolver}>
            ⬅ Volver
          </button>
        </div>
      );
    }

    function comprobarRepaso(i) {
      setRepasoRespuestaSeleccionada(i);
      setRepasoMostrar(true);
    }

    function siguienteRepaso() {
      const nuevo = repasoIndice + 1;
      setRepasoRespuestaSeleccionada(null);
      setRepasoMostrar(false);
      setRepasoIndice(nuevo);
      actualizarProgresoRepaso(revisionActiva.id, nuevo);
      setRevisionActiva((r) => ({ ...r, repasoIndice: nuevo }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
      <div style={styles.menuContainer}>
        <div style={styles.quizHeaderRow}>
          <button onClick={volverA} style={styles.quizVolverBtn}>
            ⬅ Guardar y salir
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
              key={`${repasoIndice}-${i}`}
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
                <img src={iconoExplicacion} alt="" style={styles.explicacionIcono} />
                <b>Explicación:</b>
              </div>
              {renderizarTextoConNegrita(preguntaRepaso.explicacion)}
            </div>

            <button onClick={siguienteRepaso} style={styles.ctaButton}>
              Siguiente →
            </button>
          </>
        )}
      </div>
    );
  }

  // 🔍 REVISIÓN DEL EXAMEN (redondeles por colores)
  if (vista === "revision" && revisionActiva) {
    const lista = revisionActiva.preguntas;
    const actual = lista[revisionIndice];
    const volverA = () =>
      setVista(volverDesdeRevision === "resultado" && resultadoSimulacro ? "resultado" : "historial");

    function estadoDe(p) {
      if (p.marcada === null || p.marcada === undefined) return "blanco";
      return p.marcada === p.correcta ? "acierto" : "error";
    }

    const COLORES = {
      acierto: { fondo: "#dbe7d3", texto: "#4f6b4a", etiqueta: "La acertaste", plural: "acertadas" },
      error: { fondo: "#f6d3d3", texto: "#9a4f4f", etiqueta: "La fallaste", plural: "falladas" },
      blanco: { fondo: "#fffdf9", texto: "#8a8578", etiqueta: "La dejaste en blanco", plural: "en blanco" }
    };

    const cuenta = { acierto: 0, error: 0, blanco: 0 };
    lista.forEach((p) => {
      cuenta[estadoDe(p)] += 1;
    });
    const estadoActual = estadoDe(actual);

    function irA(i) {
      setRevisionIndice(i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
      <div style={styles.menuContainer}>
        <div style={styles.quizHeaderRow}>
          <button onClick={volverA} style={styles.quizVolverBtn}>
            ⬅ Volver
          </button>
        </div>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Revisión del examen</h1>
          <div style={styles.menuUnderline} />
        </div>
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          {revisionActiva.fecha} · Nota {revisionActiva.nota}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", margin: "8px 0 12px" }}>
          {["acierto", "error", "blanco"].map((e) => (
            <span
              key={e}
              style={{
                background: COLORES[e].fondo,
                color: COLORES[e].texto,
                border: "1px solid #efe7da",
                borderRadius: 999,
                padding: "5px 12px",
                fontSize: 13
              }}
            >
              {cuenta[e]} {COLORES[e].plural}
            </span>
          ))}
        </div>

        <div style={styles.simDotsWrap}>
          {lista.map((p, i) => {
            const e = estadoDe(p);
            return (
              <button
                key={i}
                onClick={() => setRevisionIndice(i)}
                style={{
                  ...styles.simDot,
                  background: COLORES[e].fondo,
                  color: COLORES[e].texto,
                  border: i === revisionIndice ? "2px solid #b9a8de" : "1px solid #efe7da"
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <span style={styles.quizPreguntaTag}>
            Pregunta {revisionIndice + 1} de {lista.length}
          </span>
          <span
            style={{
              background: COLORES[estadoActual].fondo,
              color: COLORES[estadoActual].texto,
              border: "1px solid #efe7da",
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 13
            }}
          >
            {COLORES[estadoActual].etiqueta}
          </span>
        </div>

        <div style={styles.quizPreguntaCard}>
          <p style={styles.quizPreguntaTexto}>{actual.pregunta}</p>
        </div>

        {actual.respuestas.map((r, i) => {
          let estilo = {};
          if (i === actual.correcta) estilo = styles.quizRespuestaCorrecta;
          else if (i === actual.marcada) estilo = styles.quizRespuestaIncorrecta;

          return (
            <div
              key={`${revisionIndice}-${i}`}
              style={{ ...styles.quizRespuestaBtn, ...estilo, cursor: "default" }}
            >
              <span style={styles.quizRespuestaLetra}>{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1 }}>{r}</span>
              {i === actual.marcada && (
                <span style={{ fontSize: 12, color: "#8a8578", marginLeft: 8, whiteSpace: "nowrap" }}>
                  Tu respuesta
                </span>
              )}
            </div>
          );
        })}

        <div style={styles.explicacionCaja}>
          <div style={styles.explicacionTituloRow}>
            <img src={iconoExplicacion} alt="" style={styles.explicacionIcono} />
            <b>Explicación:</b>
          </div>
          {renderizarTextoConNegrita(actual.explicacion)}
        </div>

        <div style={styles.simNavRow}>
          <button
            disabled={revisionIndice === 0}
            onClick={() => irA(revisionIndice - 1)}
            style={{
              ...styles.simNavBtn,
              background: "#fff",
              color: "#4a463f",
              opacity: revisionIndice === 0 ? 0.4 : 1
            }}
          >
            ← Anterior
          </button>
          <button
            disabled={revisionIndice + 1 >= lista.length}
            onClick={() => irA(revisionIndice + 1)}
            style={{
              ...styles.simNavBtn,
              ...styles.btnPeach,
              opacity: revisionIndice + 1 >= lista.length ? 0.4 : 1
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>
    );
  }
  // 🕓 HISTORIAL DE SIMULACROS
if (vista === "historial") {
  const historial = obtenerHistorialSimulacro();
  const revisiones = obtenerRevisiones();
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

            {historial.map((s, i) => {
            const rev = s.id ? revisiones.find((r) => r.id === s.id) : null;
            const totalFalladas = rev ? rev.preguntas.filter((p) => p.marcada !== p.correcta).length : 0;
            const avance = rev ? rev.repasoIndice || 0 : 0;

            return (
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
                  <span style={styles.inlineStatRow}>
                    <img src={iconoCronometro} alt="" style={styles.iconoInlinePequeno} /> {s.tiempo}
                  </span>
                </div>

                {rev && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => abrirRevision(rev, "historial")}
                      style={{ ...styles.repasarBoton, flex: 1, background: "#e6dcf3" }}
                    >
                      Revisar
                    </button>
                    {totalFalladas > 0 && (
                      <button
                        onClick={() => abrirRepaso(rev, "historial")}
                        style={{ ...styles.repasarBoton, flex: 1, background: "#f6dade" }}
                      >
                        {avance >= totalFalladas
                          ? "Repaso hecho ✓"
                          : avance > 0
                          ? `Seguir repaso (${avance}/${totalFalladas})`
                          : "Repasar falladas"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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