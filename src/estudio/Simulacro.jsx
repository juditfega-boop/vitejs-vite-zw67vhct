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
import { TituloHub, COLOR_SECCION } from "../componentes/Hub";

// tarjeta de cuaderno (como en Favoritas y Test terminado)
const tarjetaCuaderno = {
  background: "#fdfaf4",
  borderRadius: 24,
  padding: 16,
  boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
  marginBottom: 14,
  position: "relative"
};


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
  const [verTodas, setVerTodas] = useState(false); // ventanita con todas las preguntas
  const [avisoEntrega, setAvisoEntrega] = useState(null); // al pulsar «Entregar»: cuántas quedan en blanco
  const pregunta = preguntas[indice];

  // ⏱️ cuenta atrás del examen (se congela durante la pausa)
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
    setAvisoEntrega(sinResponder);
  }

  // salta a la primera pregunta que está en blanco
  function irAPrimeraEnBlanco() {
    const i = respuestasSimulacro.findIndex((r) => r === null || r === undefined);
    if (i >= 0) setIndice(i);
    setAvisoEntrega(null);
    setVerTodas(false);
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
      minutos: Math.ceil(segundosEmpleados / 60),
      mejoresBloques,
      peoresBloques,
      notaAnterior,
      intento: historialPrevio.length + 1,
      fallidas
    };

    guardarSimulacroHistorial(resultado);

    setResultadoSimulacro(resultado);
    setAvisoEntrega(null);
    setVerTodas(false);
    setTiempoRestanteSimulacro(null);
    setEnPausa(false);
    setMostrarValoracion(false);
    setRepasoIndice(0);
    setRepasoRespuestaSeleccionada(null);
    setRepasoMostrar(false);
    setVista("resultado");
  }

  // 📝 INTRO
  if (vista === "intro") {
    const regla = { display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #f0e8db", fontSize: 13.5, color: "#4a463f" };
    const icono = { width: 20, height: 20, objectFit: "contain", flexShrink: 0 };
    const cifra = { background: "#fbf0f1", borderRadius: 14, padding: 9, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#4a463f" };
    return (
      <div style={styles.menuContainer}>
        <TituloHub titulo="Simulacro oficial" subtitulo="Como el día del examen, con su tiempo y su nota." color={COLOR_SECCION.test.linea} />

        <div style={tarjetaCuaderno}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={cifra}>
              <img src={iconoExplicacion} alt="" style={{ ...icono, width: 24, height: 24 }} />
              <span>
                <b style={{ display: "block", fontSize: 17 }}>100</b>preguntas
              </span>
            </div>
            <div style={cifra}>
              <img src={iconoSimTiempo} alt="" style={{ ...icono, width: 24, height: 24 }} />
              <span>
                <b style={{ display: "block", fontSize: 17 }}>{DURACION_SIMULACRO_MINUTOS} min</b>en total
              </span>
            </div>
          </div>
          <div style={{ ...regla, marginTop: 6 }}>
            <img src={iconoSimAciertos} alt="" style={icono} /> Acierto <b style={{ marginLeft: "auto" }}>+1</b>
          </div>
          <div style={regla}>
            <img src={iconoSimErrores} alt="" style={icono} /> Error <b style={{ marginLeft: "auto" }}>−1/3</b>
          </div>
          <div style={{ ...regla, borderBottom: "none" }}>
            <img src={iconoHojaBlanco} alt="" style={icono} /> En blanco <b style={{ marginLeft: "auto" }}>no resta</b>
          </div>
        </div>

        <div style={{ ...tarjetaCuaderno, background: "#f3eefa", fontSize: 13, lineHeight: 1.45, color: "#4a463f" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Antes de empezar</p>
          <p style={{ margin: "0 0 5px" }}>🌿 Busca un sitio tranquilo y sin interrupciones.</p>
          <p style={{ margin: "0 0 5px" }}>⏱ El reloj no se para, como en el examen real.</p>
          <p style={{ margin: "0 0 5px" }}>🚻 Tienes una pausa de 5 minutos: el reloj se congela y la pregunta se oculta.</p>
          <p style={{ margin: 0 }}>📝 Puedes dejar preguntas en blanco y volver a ellas con «Ver todas».</p>
        </div>

        <button onClick={iniciarSimulacro} style={styles.ctaButton}>
          Comenzar simulacro
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          <span className="hoja-volver"></span> Volver
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
              src={iconoSimTiempo}
              alt=""
              style={{ width: 90, height: 90, objectFit: "contain", display: "block", margin: "0 auto 10px" }}
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

    const enBlanco = (i) => respuestasSimulacro[i] === null || respuestasSimulacro[i] === undefined;
    const hayEnBlanco = respuestasSimulacro.some((r, i) => enBlanco(i));
    const botonNav = { ...styles.simNavBtn, fontFamily: "inherit" };

    return (
      <div style={styles.menuContainer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <span style={styles.simTimer}>⏱ {formatearTiempo(tiempoRestanteSimulacro || 0)}</span>
          {!pausaUsada ? (
            <button
              onClick={empezarPausa}
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12.5, color: "#7d7468", cursor: "pointer", padding: 4 }}
            >
              🚻 Pausa
            </button>
          ) : (
            <span />
          )}
          <button onClick={confirmarFinalizar} style={{ ...styles.simFinalizarBtn, fontSize: 13, padding: "7px 14px", fontFamily: "inherit" }}>
            Entregar
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#7d7468", marginBottom: 6 }}>
          <span style={{ flex: 1, height: 6, borderRadius: 6, background: "#efe6d8", overflow: "hidden" }}>
            <span
              style={{
                display: "block",
                width: `${(respondidas / preguntas.length) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #d9cdf0, #f3cdd2)",
                transition: "width 0.3s ease"
              }}
            />
          </span>
          {respondidas} / {preguntas.length} respondidas
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#5b4a3a" }}>
            Pregunta {indice + 1} de {preguntas.length}
          </span>
          <button
            onClick={() => setVerTodas(true)}
            style={{
              border: "none",
              background: "#fdfaf4",
              borderRadius: 999,
              padding: "5px 12px",
              fontFamily: "inherit",
              fontSize: 12.5,
              color: "#8a6a4f",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
            }}
          >
            Ver todas ›
          </button>
        </div>

        <div style={styles.quizPreguntaCard}>
          <p style={styles.quizPreguntaTexto}>{pregunta.pregunta}</p>
        </div>

        {pregunta.respuestas.map((r, i) => {
          const elegida = respuestasSimulacro[indice] === i;
          return (
            <button
              key={i}
              onClick={() => seleccionarRespuestaSimulacro(i)}
              style={{ ...styles.quizRespuestaBtn, ...(elegida ? { background: "#f3eefa", borderColor: "#c9b6e6" } : {}) }}
            >
              <span style={{ ...styles.quizRespuestaLetra, ...(elegida ? { background: "#d9cdf0", color: "#5b4a3a" } : {}) }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span>{r}</span>
            </button>
          );
        })}

        <p style={{ ...styles.configSubLabel, textAlign: "center", fontSize: 11.5, margin: "2px 0 10px" }}>
          Si no la sabes, pasa a la siguiente: queda en blanco y puedes volver. Toca otra vez tu respuesta para quitarla.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={indice === 0}
            onClick={() => setIndice((i) => i - 1)}
            style={{ ...botonNav, flex: 1, background: "#f3ede3", color: "#7d7468", opacity: indice === 0 ? 0.4 : 1 }}
          >
            ‹ Anterior
          </button>
          {indice + 1 < preguntas.length ? (
            <button
              onClick={() => setIndice((i) => i + 1)}
              style={{ ...botonNav, flex: 1.4, background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)", color: "#5a4636" }}
            >
              Siguiente ›
            </button>
          ) : (
            <button
              onClick={confirmarFinalizar}
              style={{ ...botonNav, flex: 1.4, background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)", color: "#5a4636" }}
            >
              Entregar
            </button>
          )}
        </div>

        {/* 🗂️ «Ver todas»: las 100 preguntas, para saltar a cualquiera */}
        {verTodas && (
          <div
            onClick={() => setVerTodas(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(74,70,63,0.28)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 480,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "#fdfaf4",
                borderRadius: "26px 26px 0 0",
                padding: "18px 16px 22px",
                boxSizing: "border-box",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#4a463f"
              }}
            >
              <p style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: 28, lineHeight: 1, color: "#5b4a3a", margin: "0 0 4px" }}>
                Tus {preguntas.length} preguntas
              </p>
              <p style={{ fontSize: 12, color: "#5c5850", margin: "0 0 10px" }}>
                Verde: respondida · Blanco: en blanco · Borde rosa: estás aquí
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
                {preguntas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIndice(i);
                      setVerTodas(false);
                    }}
                    style={{
                      height: 28,
                      padding: 0,
                      borderRadius: 9,
                      fontSize: 11,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      ...(i === indice
                        ? { border: "2px solid #e2a3a9", background: "#fff", color: "#5b4a3a", fontWeight: 700 }
                        : enBlanco(i)
                        ? { border: "1px solid #e8dfd1", background: "#fff", color: "#a99c8c" }
                        : { border: "none", background: "#e3ecd9", color: "#3f5a3a" })
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => setVerTodas(false)} style={{ ...botonNav, flex: 1, background: "#f3ede3", color: "#7d7468" }}>
                  Cerrar
                </button>
                {hayEnBlanco && (
                  <button
                    onClick={irAPrimeraEnBlanco}
                    style={{ ...botonNav, flex: 1.6, background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)", color: "#5a4636" }}
                  >
                    Ir a la 1.ª en blanco
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 📮 al entregar: aviso si quedan preguntas en blanco */}
        {avisoEntrega !== null && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 70,
              background: "rgba(74,70,63,0.32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20
            }}
          >
            <div style={{ ...tarjetaCuaderno, background: "#fbf3e6", maxWidth: 360, width: "100%", margin: 0, color: "#4a463f" }}>
              {avisoEntrega > 0 ? (
                <>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>
                    {avisoEntrega === 1 ? "Te queda 1 en blanco" : `Te quedan ${avisoEntrega} en blanco`}
                  </p>
                  <p style={{ fontSize: 13, color: "#5c5850", margin: "0 0 12px", lineHeight: 1.45 }}>
                    Las preguntas en blanco no restan, pero tampoco suman. ¿Quieres repasarlas antes de entregar?
                  </p>
                  <button onClick={irAPrimeraEnBlanco} style={{ ...styles.ctaButton, marginTop: 0 }}>
                    Ir a las que faltan
                  </button>
                  <button onClick={finalizarSimulacro} style={styles.linkVolver}>
                    Entregar igualmente
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>¿Entregar el examen?</p>
                  <p style={{ fontSize: 13, color: "#5c5850", margin: "0 0 12px", lineHeight: 1.45 }}>
                    Has respondido todas las preguntas.
                  </p>
                  <button onClick={finalizarSimulacro} style={{ ...styles.ctaButton, marginTop: 0 }}>
                    Entregar
                  </button>
                  <button onClick={() => setAvisoEntrega(null)} style={styles.linkVolver}>
                    Seguir revisando
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }


// 🏁 RESULTADO
if (vista === "resultado" && resultadoSimulacro) {
  const { nota, aciertos, errores, blancos, tiempo, minutos, mejoresBloques, peoresBloques, notaAnterior, intento } =
    resultadoSimulacro;

  let mensajeComparacion;
  if (notaAnterior === null) {
    mensajeComparacion = "Es tu primer simulacro completo. ¡Enhorabuena por terminarlo!";
  } else if (Number(nota) > notaAnterior) {
    mensajeComparacion = `Has mejorado respecto a tu simulacro anterior (${notaAnterior.toFixed(2).replace(".", ",")}).`;
  } else if (Number(nota) < notaAnterior) {
    mensajeComparacion = `Has bajado un poco respecto a tu simulacro anterior (${notaAnterior.toFixed(2).replace(".", ",")}).`;
  } else {
    mensajeComparacion = "Has mantenido la misma nota que tu simulacro anterior.";
  }

  // ⏱ minutos usados y aviso de la hoja de respuestas (más de 90 minutos: poco margen)
  const usados = minutos || 0;
  const justo = usados > 90;
  const paraRepasar = errores + blancos;

  return (
    <div style={styles.menuContainer}>
      <TituloHub
        titulo="¡Simulacro entregado!"
        subtitulo={`Intento nº ${intento} · ${mensajeComparacion}`}
        color={COLOR_SECCION.test.linea}
      />

      <img src={heroSimulacroCompletado} alt="" style={{ display: "block", width: 140, margin: "-6px auto 6px" }} />

      <div style={{ ...tarjetaCuaderno, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ textAlign: "center", minWidth: 92 }}>
          <span style={{ display: "block", fontSize: 12, color: "#7d7468" }}>Nota final</span>
          <b style={{ fontSize: 38, lineHeight: 1, color: "#4a463f" }}>{String(nota).replace(".", ",")}</b>
          <span style={{ display: "block", fontSize: 11.5, color: "#7d7468" }}>sobre 10</span>
        </span>
        <span style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 0" }}>
          {[
            [iconoSimAciertos, aciertos, "aciertos"],
            [iconoSimErrores, errores, "errores"],
            [iconoSimBlancos, blancos, "en blanco"],
            [iconoSimTiempo, tiempo, "tiempo"]
          ].map(([icono, valor, texto]) => (
            <span key={texto} style={{ textAlign: "center", fontSize: 11, color: "#7d7468" }}>
              <img src={icono} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <b style={{ display: "block", fontSize: 17, color: "#4a463f", margin: "2px 0 1px" }}>{valor}</b>
              {texto}
            </span>
          ))}
        </span>
      </div>

      <div style={{ ...tarjetaCuaderno, display: "flex", gap: 12, alignItems: "flex-start", background: justo ? "#fbf0f1" : "#fdfaf4" }}>
        <img src={iconoSimTiempo} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
        <span style={{ fontSize: 13, lineHeight: 1.5, color: "#4a463f" }}>
          <b>
            Has usado {usados} de {DURACION_SIMULACRO_MINUTOS} minutos.
          </b>
          <br />
          {justo
            ? "En el examen real te habría quedado poco margen para pasar las respuestas a la hoja de respuestas. Prueba a ir algo más rápido."
            : "En el examen real, además, tienes que pasar las respuestas a la hoja de respuestas. Guarda unos 10–15 minutos para eso."}
        </span>
      </div>

      <div style={{ ...tarjetaCuaderno, padding: "10px 14px" }}>
        <button onClick={() => setMostrarValoracion((v) => !v)} style={{ ...styles.simValoracionToggle, fontFamily: "inherit" }}>
          <span>🌿 Cómo te ha ido por bloques</span>
          <span style={{ color: "#b8a993" }}>{mostrarValoracion ? "▴" : "▾"}</span>
        </button>

        {mostrarValoracion && (
          <>
            <p style={styles.simValoracionListaTitulo}>Mejores bloques</p>
            {mejoresBloques.length === 0 ? (
              <p style={styles.simValoracionTexto}>Todavía no hay ningún bloque con un 60% o más de aciertos en este simulacro.</p>
            ) : (
              mejoresBloques.map((b) => (
                <p key={b.nombre} style={{ ...styles.simValoracionTexto, marginTop: 4 }}>
                  🌿 {b.nombre} — {b.porcentaje}%
                </p>
              ))
            )}

            <p style={styles.simValoracionListaTitulo}>Bloques a reforzar</p>
            {peoresBloques.length === 0 ? (
              <p style={styles.simValoracionTexto}>Ningún bloque por debajo del 40% de aciertos. ¡Buen trabajo!</p>
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

      {paraRepasar > 0 ? (
        <button
          onClick={() => {
            setRepasoIndice(0);
            setRepasoRespuestaSeleccionada(null);
            setRepasoMostrar(false);
            setVista("repaso");
          }}
          style={styles.ctaButton}
        >
          Repasar las {paraRepasar} falladas o en blanco
        </button>
      ) : (
        <button onClick={volverMenu} style={styles.ctaButton}>
          Volver al menú
        </button>
      )}

      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginTop: 4 }}>
        <button onClick={() => setVista("historial")} style={{ ...styles.linkVolver, width: "auto" }}>
          <span style={styles.botonIconoTextoRow}>
            <img src={iconoHistorial} alt="" style={styles.iconoInlinePequeno} />
            Historial
          </span>
        </button>
        {paraRepasar > 0 && (
          <button onClick={volverMenu} style={{ ...styles.linkVolver, width: "auto" }}>
            <span className="hoja-volver"></span> Volver al menú
          </button>
        )}
      </div>
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
            <span className="hoja-volver"></span> Resultado
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
        <span className="hoja-volver"></span> Volver al resultado
      </button>
    </div>
  );
}

return null;
}