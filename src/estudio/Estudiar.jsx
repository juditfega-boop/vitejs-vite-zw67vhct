import { useState, useEffect } from "react";
import {
  obtenerStats,
  registrarRespuesta,
  obtenerRacha,
  actualizarRacha,
  obtenerTiempos,
  registrarTiempoPregunta,
  obtenerFavoritos,
  guardarFavoritos
} from "../servicios/progreso";
import { styles } from "../estilos";
import iconoTazaPlantita from "../assets/kit/icono-taza-plantita-evolucion.png";
import iconoRelojEvolucion from "../assets/kit/icono-reloj-simulacro.png";
import iconoPlantitaEvolucion from "../assets/kit/icono-plantita-evolucion.png";
import iconoRepasarHero from "../assets/kit/icono-repasar-errores-hero.png";
import iconoCarpetitaPrioritarios from "../assets/kit/icono-carpetita-prioritarios.png";
import iconoCarpetitaSeguimiento from "../assets/kit/icono-carpetita-seguimiento.png";
import iconoCarpetitaResueltos from "../assets/kit/icono-carpetita-resueltos.png";
import iconoCasosPrioritarios from "../assets/kit/icono-casos-prioritarios.png";
import iconoCasosSeguimiento from "../assets/kit/icono-casos-seguimiento.png";
import iconoCasosResueltos from "../assets/kit/icono-casos-resueltos.png";
import iconoCarpetaFavoritas from "../assets/kit/icono-favoritos-corazon.png";
import iconoGrafico from "../assets/kit/icono-grafico-evolucion.png";
import iconoLibroEstudiar from "../assets/kit/icono-libro-estudiar.png";
import iconoTipoEstudio from "../assets/kit/icono-tipo-estudio-planta.png";
import iconoNumPreguntas from "../assets/kit/icono-num-preguntas-flor.png";
import iconoCronometro from "../assets/kit/icono-cronometro-reloj.png";
import iconoExplicacion from "../assets/kit/icono-explicacion-libreta.png";
import plantaFeliz from "../assets/kit/planta-resultado-feliz.png";
import plantaTriste from "../assets/kit/planta-resultado-triste.png";
import iconoFinBloqueHero from "../assets/kit/icono-fin-bloque-hero.png";
import iconoFinAciertos from "../assets/kit/icono-fin-aciertos.png";
import iconoFinExpedientes from "../assets/kit/icono-fin-expedientes.png";
import iconoFinRacha from "../assets/kit/icono-fin-racha.png";
import iconoFavoritoLleno from "../assets/bookbrand/icono-brand-favorito-lleno.png";
import iconoFavoritoVacio from "../assets/bookbrand/icono-brand-favorito-vacio.png";
import iconoFolderVacio from "../assets/kit/icono-favoritos-corazon-carpeta.png";
import iconoRachaLlama from "../assets/bookbrand/icono-brand-racha-llama.png";

// CSS del interruptor tipo "pastilla" (encendido/apagado), igual al que ya usa el resto de la app
const estudiarEstilosLocales = `
  .icono-mini-header {
    width: 18px !important;
    height: 18px !important;
    max-width: 18px !important;
    max-height: 18px !important;
    object-fit: contain !important;
    display: inline-block !important;
  }
  .icono-mini-config {
    width: 24px !important;
    height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
    object-fit: contain !important;
    display: inline-block !important;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 46px;
    height: 26px;
    flex-shrink: 0;
  }
  .switch input { display: none; }
  .switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #e4ddcf;
    transition: 0.2s;
    border-radius: 26px;
  }
  .switch .slider:before {
    position: absolute;
    content: "";
    height: 20px; width: 20px;
    left: 3px; bottom: 3px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .switch input:checked + .slider {
    background-color: #e29aa0;
  }
  .switch input:checked + .slider:before {
    transform: translateX(20px);
  }
`;

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

function formatearTextoLargo(texto) {
  if (!texto) return "";
  return texto.replace(/\.(?=[A-ZÁÉÍÓÚÑ])/g, ".\n");
}

function renderizarTextoConNegrita(texto) {
  const textoConSaltos = formatearTextoLargo(texto);
  const parrafos = textoConSaltos.split("\n").filter((p) => p.trim() !== "");
  return parrafos.map((parrafo, i) => {
    const partes = parrafo.split(/(\*\*.+?\*\*)/g);
    return (
      <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0" }}>
        {partes.map((parte, j) =>
          parte.startsWith("**") && parte.endsWith("**") ? (
            <b key={j}>{parte.slice(2, -2)}</b>
          ) : (
            parte
          )
        )}
      </p>
    );
  });
}

// 📖 "Estudiar" + Quiz + Mi progreso — componente independiente y autocontenido.
// vistaInicial permite entrar directamente en "config" (botón Estudiar del menú)
// o en "progreso" (botón Mi evolución del menú), compartiendo todo lo demás.
export default function Estudiar({ preguntasBase, volverMenu, sincronizarConNube, vistaInicial = "config" }) {
  const [vista, setVista] = useState(vistaInicial);
  // config|quiz|resultado|progreso|estadisticas|errores|favoritos

  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [cantidad, setCantidad] = useState(20);

  const [tipoEstudio, setTipoEstudio] = useState("general");
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [tipoCronometro, setTipoCronometro] = useState("auto");
  const [minutosPersonalizados, setMinutosPersonalizados] = useState(20);
  const [conExplicacion, setConExplicacion] = useState(true);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [inicioPregunta, setInicioPregunta] = useState(null);
  const [tabEvolucion, setTabEvolucion] = useState("resumen");
  const [favoritos, setFavoritos] = useState(() => obtenerFavoritos());
  const [expedientesResueltos, setExpedientesResueltos] = useState(0);
  const [tabErroresVacio, setTabErroresVacio] = useState("prioritarios");

  const pregunta = preguntas[indice];

  useEffect(() => {
    const boton = document.getElementById("boton-panico");
    if (!boton) return;
    boton.style.display = vista === "quiz" ? "none" : "";
  }, [vista]);

  function toggleFavorito(id) {
    setFavoritos((prev) => {
      const idStr = String(id);
      const nuevo = prev.includes(idStr) ? prev.filter((f) => f !== idStr) : [...prev, idStr];
      guardarFavoritos(nuevo);
      return nuevo;
    });
    sincronizarConNube();
  }

  function volverAProgreso() {
    setVista("progreso");
    sincronizarConNube();
  }

  function volverAErrores() {
    setVista("errores");
  }

  function mostrarVacio(tab) {
    setTabErroresVacio(tab);
    setVista("errores-vacio");
  }

  useEffect(() => {
    if (pregunta) setInicioPregunta(Date.now());
  }, [pregunta]);

  useEffect(() => {
    if (vista !== "quiz" || tiempoRestante === null) return;

    if (tiempoRestante <= 0) {
      setTiempoRestante(null);
      setVista("resultado");
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestante((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, tiempoRestante]);

  function comenzarEstudioPersonalizado() {
    let listaFuente = preguntasBase;

    if (tipoEstudio === "bloques") {
      listaFuente = preguntasBase.filter((p) =>
        bloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const base = mezclar(listaFuente).slice(0, cantidad).map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setExpedientesResueltos(0);
    setMensaje("");
    setMostrar(false);

    if (cronometroActivo) {
      const minutos = tipoCronometro === "auto" ? cantidad : (minutosPersonalizados || 1);
      setTiempoRestante(minutos * 60);
    } else {
      setTiempoRestante(null);
    }

    actualizarRacha();
    setVista("quiz");
  }

  function toggleBloqueSeleccionado(nombre) {
    setBloquesSeleccionados((prev) =>
      prev.includes(nombre) ? prev.filter((b) => b !== nombre) : [...prev, nombre]
    );
  }

  function iniciarBloque(lista) {
    const base = mezclar(lista).slice(0, cantidad).map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setExpedientesResueltos(0);
    setMensaje("");
    setMostrar(false);
    setTiempoRestante(null);
    setConExplicacion(true);
    actualizarRacha();
    setVista("quiz");
  }

  function obtenerPreguntasDebiles(lista) {
    const stats = obtenerStats();
    const muyOlvidadas = [];
    const pendientes = [];
    const recuperadas = [];

    lista.forEach((p) => {
      const s = stats[String(p.id)];
      if (!s) return;

      if (s.aciertos >= s.errores && s.errores > 0) {
        recuperadas.push(p);
      } else if (s.errores >= 3) {
        muyOlvidadas.push(p);
      } else if (s.errores > s.aciertos) {
        pendientes.push(p);
      }
    });

    return [...muyOlvidadas, ...pendientes, ...recuperadas];
  }

  const pendientesErrores = obtenerPreguntasDebiles(preguntasBase).length;

  function comprobar(index) {
    const esCorrecta = index === pregunta.correcta;
    const statsAntes = obtenerStats()[String(pregunta.id)];
    const teniaFallosPrevios = statsAntes && statsAntes.errores > 0 && statsAntes.errores >= statsAntes.aciertos;

    registrarRespuesta(pregunta, esCorrecta);

    if (inicioPregunta) {
      const segundos = Math.round((Date.now() - inicioPregunta) / 1000);
      registrarTiempoPregunta(segundos);
    }

    if (esCorrecta) {
      setMensaje("Correcto");
      setAciertos((a) => a + 1);
      if (teniaFallosPrevios) setExpedientesResueltos((e) => e + 1);
    } else {
      setMensaje("Incorrecto");
    }

    setMostrar(true);
  }

  function siguiente() {
    setMensaje("");
    setMostrar(false);

    if (indice + 1 < preguntas.length) {
      setIndice((i) => {
        console.log("avanzando indice", i, "->", i + 1, "total preguntas:", preguntas.length);
        return i + 1;
      });
    } else {
      setVista("resultado");
    }
  }

  function anterior() {
    if (indice === 0) return;
    setMensaje("");
    setMostrar(false);
    setIndice((i) => i - 1);
  }

  // ⚙️ CONFIGURACIÓN DE ESTUDIO
  if (vista === "config") {
    const bloquesDisponibles = Object.keys(agruparPorBloques(preguntasBase));
    const puedeComenzar = tipoEstudio === "general" || bloquesSeleccionados.length > 0;

    return (
<div style={styles.menuContainer}>
<style>{estudiarEstilosLocales}</style>

        <div style={styles.menuHeader}>
        <div style={styles.estudiarHeaderRow}>
            <h1 style={styles.menuTitle}>Estudiar</h1>
            <img src={iconoLibroEstudiar} alt="" style={styles.estudiarHeaderIcono} />
          </div>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
        <div style={styles.configCardTitleRow}>
            <img src={iconoTipoEstudio} alt="" className="icono-mini-config" style={styles.configCardIcono} />
            <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>Tipo de estudio</p>
          </div>       
          <div style={styles.pillGroup}>
            <button
              className="pill"
              onClick={() => setTipoEstudio("general")}
              style={{ ...styles.pillBtn, ...(tipoEstudio === "general" ? styles.pillBtnActiva : {}) }}
            >
              Estudio general
            </button>
            <button
              className="pill"
              onClick={() => setTipoEstudio("bloques")}
              style={{ ...styles.pillBtn, ...(tipoEstudio === "bloques" ? styles.pillBtnActiva : {}) }}
            >
              Por bloques
            </button>
          </div>

          {tipoEstudio === "bloques" && (
            <div style={styles.bloquesGrid}>
              {bloquesDisponibles.map((b) => (
                <button
                  key={b}
                  className="bloque-chip"
                  onClick={() => toggleBloqueSeleccionado(b)}
                  style={{
                    ...styles.bloqueChip,
                    ...(bloquesSeleccionados.includes(b) ? styles.bloqueChipActiva : {})
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.configCard}>
        <div style={styles.configCardTitleRow}>
            <img src={iconoNumPreguntas} alt="" className="icono-mini-config" style={styles.configCardIcono} />
            <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>Número de preguntas</p>
          </div>
          <div style={styles.pillGroup}>
            {[10, 20, 30, 50, 100].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => setCantidad(n)}
                style={{ ...styles.pillBtn, ...(cantidad === n ? styles.pillBtnActiva : {}) }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
          <div style={{ ...styles.configCardTitleRow, marginBottom: 0 }}>
              <img src={iconoCronometro} alt="" className="icono-mini-config" style={styles.configCardIcono} />
              <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>Activar cronómetro</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={cronometroActivo}
                onChange={() => setCronometroActivo((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {cronometroActivo && (
            <>
              <div style={{ ...styles.pillGroup, marginTop: 12 }}>
                <button
                  className="pill"
                  onClick={() => setTipoCronometro("auto")}
                  style={{ ...styles.pillBtn, ...(tipoCronometro === "auto" ? styles.pillBtnActiva : {}) }}
                >
                  1 min / pregunta
                </button>
                <button
                  className="pill"
                  onClick={() => setTipoCronometro("personalizado")}
                  style={{
                    ...styles.pillBtn,
                    ...(tipoCronometro === "personalizado" ? styles.pillBtnActiva : {})
                  }}
                >
                  Personalizado
                </button>
              </div>

              {tipoCronometro === "personalizado" && (
                <div style={{ marginTop: 10 }}>
                  <label style={styles.configSubLabel}>Minutos totales: </label>
                  <input
                    type="number"
                    min={1}
                    value={minutosPersonalizados}
                    onChange={(e) => setMinutosPersonalizados(Number(e.target.value))}
                    style={styles.numeroInput}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
          <div style={{ ...styles.configCardTitleRow, marginBottom: 0 }}>
              <img src={iconoExplicacion} alt="" className="icono-mini-config" style={styles.configCardIcono} />
              <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>Mostrar explicación al responder</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={conExplicacion}
                onChange={() => setConExplicacion((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button
          onClick={comenzarEstudioPersonalizado}
          disabled={!puedeComenzar}
          style={{ ...styles.ctaButton, ...(puedeComenzar ? {} : styles.ctaButtonDisabled) }}
        >
          Comenzar estudio
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

// 📈 MI EVOLUCIÓN (hub de 3 accesos)
if (vista === "progreso") {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>Mi evolución</h1>
        <div style={styles.menuUnderline} />
      </div>

      <button onClick={() => setVista("estadisticas")} style={styles.filaMinijuegoBtn}>
        <img src={iconoGrafico} alt="" style={styles.miniaturaMinijuego} />
        <span style={styles.filaMinijuegoTexto}>Estadísticas</span>
        <span style={{ color: "#8a8578" }}>→</span>
      </button>

      <button onClick={() => setVista("errores")} style={styles.filaMinijuegoBtn}>
          <img src={iconoRepasarHero} alt="" style={styles.miniaturaMinijuego} />
          <span style={styles.filaMinijuegoTexto}>Repasar errores ({pendientesErrores})</span>
          <span style={{ color: "#8a8578" }}>→</span>
        </button>

      <button onClick={() => setVista("favoritos")} style={styles.filaMinijuegoBtn}>
        <img src={iconoCarpetaFavoritas} alt="" style={styles.miniaturaMinijuego} />
        <span style={styles.filaMinijuegoTexto}>Favoritas ({favoritos.length})</span>
        <span style={{ color: "#8a8578" }}>→</span>
      </button>

      <button onClick={volverMenu} style={styles.linkVolver}>
        ⬅ Volver al menú
      </button>
    </div>
  );
}

// 📊 ESTADÍSTICAS (Resumen + Por bloques)
if (vista === "estadisticas") {
  const statsGuardadas = obtenerStats();
  const bloques = {};

  Object.values(statsGuardadas).forEach((dato) => {
    const bloque = dato.bloque || "Sin bloque";
    if (!bloques[bloque]) bloques[bloque] = { respondidas: 0, aciertos: 0 };
    bloques[bloque].respondidas += dato.veces || 0;
    bloques[bloque].aciertos += dato.aciertos || 0;
  });

  function mensajeBloque(p) {
    if (p >= 90) return "🎓 Nivel Jane Addams: podrías montar tu propia Hull House";
    if (p >= 75) return "💪 Caso con alta autonomía, casi de alta";
    if (p >= 60) return "🙂 Vas bien, aunque el expediente aún tiene puntos abiertos";
    if (p >= 40) return "⚠️ Este bloque necesita un plan de intervención en condiciones";
    if (p >= 20) return "🚨 Caso de alta vulnerabilidad — refuerza la red de apoyo";
    return "🆘 Urgencia social: deriva este bloque a estudio inmediato";
  }

  const ordenados = Object.entries(bloques)
    .map(([nombre, datos]) => ({
      nombre,
      porcentaje: datos.respondidas ? Math.round((datos.aciertos / datos.respondidas) * 100) : 0
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  const totalRespondidas = Object.values(statsGuardadas).reduce((a, b) => a + (b.veces || 0), 0);
  const totalAciertos = Object.values(statsGuardadas).reduce((a, b) => a + (b.aciertos || 0), 0);
  const porcentajeGlobal = totalRespondidas ? Math.round((totalAciertos / totalRespondidas) * 100) : 0;

  const racha = obtenerRacha().racha;
  const tiempos = obtenerTiempos();
  const horasEstudio = Math.round((tiempos.totalSegundos / 3600) * 10) / 10;

  function mensajeGlobal(p) {
    if (p >= 80) return "Muy buen progreso";
    if (p >= 60) return "Vas por buen camino";
    if (p >= 40) return "Sigue regando este jardín";
    if (p > 0) return "Toca reforzar un poco más";
    return "Aún no hay datos suficientes";
  }

  // círculo de progreso (SVG)
  const radio = 52;
  const circunferencia = 2 * Math.PI * radio;
  const relleno = (porcentajeGlobal / 100) * circunferencia;

  return (
    <div style={styles.menuContainer}>
<div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Estadísticas</h1>
          <div style={styles.menuUnderline} />
        </div>

      <div style={styles.evolucionTabs}>
        <button
          onClick={() => setTabEvolucion("resumen")}
          style={{
            ...styles.evolucionTabBtn,
            ...(tabEvolucion === "resumen" ? styles.evolucionTabBtnActiva : {})
          }}
        >
          Resumen
        </button>
        <button
          onClick={() => setTabEvolucion("bloques")}
          style={{
            ...styles.evolucionTabBtn,
            ...(tabEvolucion === "bloques" ? styles.evolucionTabBtnActiva : {})
          }}
        >
          Por bloques
        </button>
      </div>

      {tabEvolucion === "resumen" && (
        <>
          <div style={styles.evolucionAnilloCard}>
            <p style={styles.evolucionAnilloTitulo}>Rendimiento global</p>

            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={radio} fill="none" stroke="#f0ece0" strokeWidth="12" />
              <circle
                cx="65"
                cy="65"
                r={radio}
                fill="none"
                stroke="#a8c9ae"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${relleno} ${circunferencia}`}
                transform="rotate(-90 65 65)"
              />
              <text x="65" y="72" textAnchor="middle" fontSize="26" fontWeight="700" fill="#4a463f">
                {porcentajeGlobal}%
              </text>
            </svg>

            <p style={styles.evolucionAnilloSubtitulo}>{mensajeGlobal(porcentajeGlobal)}</p>
          </div>

          <div style={styles.evolucionStatsRow}>
            <div style={styles.evolucionStatItem}>
              <img src={iconoPlantitaEvolucion} alt="" style={styles.evolucionStatIcono} />
              <p style={styles.evolucionStatValor}>{totalRespondidas}</p>
              <p style={styles.evolucionStatEtiqueta}>Preguntas aprendidas</p>
            </div>
            <div style={styles.evolucionStatItem}>
              <img src={iconoRelojEvolucion} alt="" style={styles.evolucionStatIcono} />
              <p style={styles.evolucionStatValor}>{horasEstudio}</p>
              <p style={styles.evolucionStatEtiqueta}>Horas de estudio</p>
            </div>
            <div style={styles.evolucionStatItem}>
              <img src={iconoRachaLlama} alt="" style={styles.evolucionStatIcono} />
              <p style={styles.evolucionStatValor}>{racha}</p>
              <p style={styles.evolucionStatEtiqueta}>Días racha actual</p>
            </div>
          </div>

          <div style={styles.evolucionMensajeCard}>
            <img src={iconoTazaPlantita} alt="" style={styles.evolucionMensajeIcono} />
            <p style={styles.evolucionMensajeTexto}>
              {racha > 0
                ? "Eres constante y eso se nota. Sigue regando tu jardín cada día."
                : "Cada respuesta es una raíz más fuerte. Empieza hoy tu racha."}
            </p>
          </div>

          </>
        )}

      {tabEvolucion === "bloques" && (
        <>
          {ordenados.length === 0 ? (
            <p style={styles.configSubLabel}>Todavía no has respondido preguntas 😅</p>
          ) : (
            ordenados.map((b) => (
              <div key={b.nombre} style={styles.configCard}>
                <p style={styles.configCardTitle}>{b.nombre}</p>
                <p style={styles.configSubLabel}>{b.porcentaje}% aciertos</p>
                <p style={{ ...styles.configSubLabel, marginTop: 6 }}>{mensajeBloque(b.porcentaje)}</p>
              </div>
            ))
          )}
        </>
      )}

      <button onClick={volverMenu} style={styles.linkVolver}>
        ⬅ Volver al menú
      </button>
    </div>
  );
}

  // ❤️ FAVORITAS
  if (vista === "favoritos") {
    const listaFavoritas = preguntasBase.filter((p) => favoritos.includes(String(p.id)));

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>❤️ Favoritas</h1>
          <div style={styles.menuUnderline} />
        </div>

        {listaFavoritas.length === 0 ? (
          <p style={styles.configSubLabel}>
            Aún no has marcado ninguna pregunta con ⭐. Puedes hacerlo desde cualquier
            pregunta durante el estudio.
          </p>
        ) : (
          <>
            <p style={styles.configSubLabel}>
              Tienes {listaFavoritas.length} pregunta{listaFavoritas.length === 1 ? "" : "s"}{" "}
              guardada{listaFavoritas.length === 1 ? "" : "s"}.
            </p>

            <button onClick={() => iniciarBloque(listaFavoritas)} style={styles.ctaButton}>
              Repasar favoritas
            </button>
          </>
        )}

        <button onClick={volverAProgreso} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

// ⭐ REPASAR ERRORES
if (vista === "errores") {
  const stats = obtenerStats();
  const muyOlvidadas = [];
  const pendientes = [];
  const recuperadas = [];

  preguntasBase.forEach((p) => {
    const s = stats[String(p.id)];
    if (!s) return;

    if (s.aciertos >= s.errores && s.errores > 0) {
      recuperadas.push(p);
    } else if (s.errores >= 3) {
      muyOlvidadas.push(p);
    } else if (s.errores > s.aciertos) {
      pendientes.push(p);
    }
  });

  return (
    <div style={styles.menuContainer}>
      <img src={iconoRepasarHero} alt="" style={styles.repasarHeroImg} />

      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>Repasar errores</h1>
        <div style={styles.menuUnderline} />
      </div>

      <div style={styles.repasarResumenCard}>
        <div style={styles.repasarResumenItem}>
          <img src={iconoCarpetitaPrioritarios} alt="" style={styles.repasarResumenIcono} />
          <p style={styles.repasarResumenValor}>{muyOlvidadas.length}</p>
          <p style={styles.repasarResumenEtiqueta}>prioritarios</p>
        </div>
        <div style={styles.repasarResumenItem}>
          <img src={iconoCarpetitaSeguimiento} alt="" style={styles.repasarResumenIcono} />
          <p style={styles.repasarResumenValor}>{pendientes.length}</p>
          <p style={styles.repasarResumenEtiqueta}>en seguimiento</p>
        </div>
        <div style={styles.repasarResumenItem}>
          <img src={iconoCarpetitaResueltos} alt="" style={styles.repasarResumenIcono} />
          <p style={styles.repasarResumenValor}>{recuperadas.length}</p>
          <p style={styles.repasarResumenEtiqueta}>resueltos</p>
        </div>
      </div>

      <div style={{ ...styles.repasarFilaCard, background: "#f9e3e3" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <img src={iconoCasosPrioritarios} alt="" style={styles.repasarFilaIcono} />
          <div style={{ flex: 1 }}>
            <p style={styles.repasarFilaTitulo}>🔴 Casos prioritarios ({muyOlvidadas.length})</p>
            <p style={styles.repasarFilaTexto}>
              Estos conceptos necesitan volver pronto. Conviene repasarlos antes de que se olviden.
            </p>
          </div>
        </div>
        <button
          onClick={() => (muyOlvidadas.length > 0 ? iniciarBloque(muyOlvidadas) : mostrarVacio("prioritarios"))}
          style={{ ...styles.repasarBoton, background: "#f0c3c3" }}
        >
          🍃 Revisar expedientes
        </button>
      </div>

      <div style={{ ...styles.repasarFilaCard, background: "#f7e9d2" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <img src={iconoCasosSeguimiento} alt="" style={styles.repasarFilaIcono} />
          <div style={{ flex: 1 }}>
            <p style={styles.repasarFilaTitulo}>🟡 Casos en seguimiento ({pendientes.length})</p>
            <p style={styles.repasarFilaTexto}>
              Ya has avanzado mucho con ellos. Cada repaso los hace más fuertes.
            </p>
          </div>
        </div>
        <button
          onClick={() => (pendientes.length > 0 ? iniciarBloque(pendientes) : mostrarVacio("seguimiento"))}
          style={{ ...styles.repasarBoton, background: "#eed7a3" }}
        >
          🍃 Continuar repasando
        </button>
      </div>

      <div style={{ ...styles.repasarFilaCard, background: "#e3ecd9" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <img src={iconoCasosResueltos} alt="" style={styles.repasarFilaIcono} />
          <div style={{ flex: 1 }}>
            <p style={styles.repasarFilaTitulo}>🟢 Casos resueltos ({recuperadas.length})</p>
            <p style={styles.repasarFilaTexto}>
              Estos conceptos ya forman parte de tus raíces. ¡Buen trabajo!
            </p>
          </div>
        </div>
        <button
          onClick={() => (recuperadas.length > 0 ? iniciarBloque(recuperadas) : mostrarVacio("resueltos"))}
          style={{ ...styles.repasarBoton, background: "#c9dcb5" }}
        >
          🍃 Ver historial
        </button>
      </div>

      <button onClick={volverAProgreso} style={styles.linkVolver}>
        ⬅ Volver
      </button>
    </div>
  );
}

// 🗂️ REPASAR ERRORES — sin expedientes en la categoría elegida
if (vista === "errores-vacio") {
  const titulosVacio = {
    prioritarios: "Prioritarios",
    seguimiento: "En seguimiento",
    resueltos: "Resueltos"
  };

  const subtitulosVacio = {
    prioritarios: "¡Genial! Ahora mismo no tienes preguntas que necesiten tu atención urgente.",
    seguimiento: "No hay expedientes en seguimiento en este momento. Todo bajo control.",
    resueltos: "Todavía no has resuelto ningún expediente difícil. En cuanto lo hagas, aparecerá aquí."
  };

  return (
    <div style={styles.menuContainer}>
      <div style={styles.quizHeaderRow}>
        <button onClick={volverAErrores} style={styles.quizVolverBtn}>
          ⬅ Repasar errores
        </button>
      </div>

      <div style={styles.evolucionTabs}>
        {["prioritarios", "seguimiento", "resueltos"].map((tab) => (
          <button
            key={tab}
            onClick={() => setTabErroresVacio(tab)}
            style={{
              ...styles.evolucionTabBtn,
              ...(tabErroresVacio === tab ? styles.evolucionTabBtnActiva : {})
            }}
          >
            {titulosVacio[tab]}
          </button>
        ))}
      </div>

      <img src={iconoFolderVacio} alt="" style={styles.erroresVacioIlustracion} />

      <h2 style={styles.erroresVacioTitulo}>No hay expedientes</h2>
      <p style={styles.erroresVacioSubtitulo}>{subtitulosVacio[tabErroresVacio]}</p>

      <button onClick={volverAErrores} style={styles.ctaButton}>
        Volver al resumen
      </button>
    </div>
  );
}

  // 📊 ESTADÍSTICAS (Resumen + Por bloques)
if (vista === "estadisticas") {
    const statsGuardadas = obtenerStats();
    const bloques = {};

    Object.values(statsGuardadas).forEach((dato) => {
      const bloque = dato.bloque || "Sin bloque";
      if (!bloques[bloque]) bloques[bloque] = { respondidas: 0, aciertos: 0 };
      bloques[bloque].respondidas += dato.veces || 0;
      bloques[bloque].aciertos += dato.aciertos || 0;
    });

    function mensajeBloque(p) {
      if (p >= 90) return "🎓 Nivel Jane Addams: podrías montar tu propia Hull House";
      if (p >= 75) return "💪 Caso con alta autonomía, casi de alta";
      if (p >= 60) return "🙂 Vas bien, aunque el expediente aún tiene puntos abiertos";
      if (p >= 40) return "⚠️ Este bloque necesita un plan de intervención en condiciones";
      if (p >= 20) return "🚨 Caso de alta vulnerabilidad — hay que reforzar la red de apoyo (o sea, estudiar más)";
      return "🆘 Esto es una urgencia social: deriva este bloque a estudio inmediato";
    }

    const ordenados = Object.entries(bloques)
      .map(([nombre, datos]) => ({
        nombre,
        porcentaje: datos.respondidas ? Math.round((datos.aciertos / datos.respondidas) * 100) : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    const totalRespondidas = Object.values(statsGuardadas).reduce((a, b) => a + (b.veces || 0), 0);
    const totalAciertos = Object.values(statsGuardadas).reduce((a, b) => a + (b.aciertos || 0), 0);
    const porcentaje = totalRespondidas ? Math.round((totalAciertos / totalRespondidas) * 100) : 0;

    const racha = obtenerRacha().racha;
    const tiempos = obtenerTiempos();
    const tiempoMedio =
      tiempos.totalPreguntas > 0 ? Math.round(tiempos.totalSegundos / tiempos.totalPreguntas) : 0;
    const mejorBloque = ordenados.length > 0 ? ordenados[0] : null;
    const peorBloque = ordenados.length > 0 ? ordenados[ordenados.length - 1] : null;

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📊 Estadísticas</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalRespondidas}</div>
            <div style={styles.statLabel}>Preguntas respondidas</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{porcentaje}%</div>
            <div style={styles.statLabel}>Aciertos</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{tiempoMedio ? `${tiempoMedio}s` : "—"}</div>
            <div style={styles.statLabel}>Tiempo medio / pregunta</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>🔥 {racha}</div>
            <div style={styles.statLabel}>Días seguidos estudiando</div>
          </div>
        </div>

        {mejorBloque && (
          <div style={{ ...styles.configCard, marginBottom: 10 }}>
            <p style={styles.configCardTitle}>🏆 Mejor bloque</p>
            <p style={styles.configSubLabel}>
              {mejorBloque.nombre} — {mejorBloque.porcentaje}% aciertos
            </p>
          </div>
        )}

        {peorBloque && peorBloque !== mejorBloque && (
          <div style={styles.configCard}>
            <p style={styles.configCardTitle}>🧐 Bloque a reforzar</p>
            <p style={styles.configSubLabel}>
              {peorBloque.nombre} — {peorBloque.porcentaje}% aciertos
            </p>
          </div>
        )}

        <h3 style={styles.bloquesTitle}>Rendimiento por bloque</h3>

        {ordenados.length === 0 ? (
          <p>Todavía no has respondido preguntas 😅</p>
        ) : (
          ordenados.map((b) => (
            <div
              key={b.nombre}
              style={{ border: "1px solid #ddd", padding: 10, marginTop: 10, borderRadius: 10, background: "#fff" }}
            >
              <h3>{b.nombre}</h3>
              <p>{b.porcentaje}% aciertos</p>
              <p>{mensajeBloque(b.porcentaje)}</p>
            </div>
          ))
        )}

        <button onClick={volverAProgreso} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

// 🟣 QUIZ
if (vista === "quiz" && pregunta) {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.quizHeaderRow}>
        <button onClick={volverMenu} style={styles.quizVolverBtn}>
          ⬅ Menú
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tiempoRestante !== null && (
            <span style={styles.simTimer}>⏱ {formatearTiempo(tiempoRestante)}</span>
          )}
<button
              onClick={() => toggleFavorito(pregunta.id)}
              title="Marcar como favorita"
              style={styles.quizFavoritoBtn}
            >
              <img
                src={favoritos.includes(String(pregunta.id)) ? iconoFavoritoLleno : iconoFavoritoVacio}
                alt=""
                style={styles.quizFavoritoIcono}
              />
            </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        {indice > 0 ? (
          <button onClick={anterior} style={styles.quizVolverBtn}>
            ⬅ Anterior
          </button>
        ) : (
          <span />
        )}
        <span style={styles.quizPreguntaTag}>
          Pregunta {indice + 1} de {preguntas.length}
        </span>
      </div>

      <div style={styles.quizPreguntaCard}>
        <p style={styles.quizPreguntaTexto}>{pregunta.pregunta}</p>
      </div>

      {pregunta.respuestas.map((r, i) => {
        let estadoEstilo = {};
        if (mostrar) {
          estadoEstilo = i === pregunta.correcta ? styles.quizRespuestaCorrecta : styles.quizRespuestaIncorrecta;
        }

        return (
          <button
            key={i}
            onClick={() => comprobar(i)}
            disabled={mostrar}
            style={{ ...styles.quizRespuestaBtn, ...estadoEstilo }}
          >
            <span style={styles.quizRespuestaLetra}>{String.fromCharCode(65 + i)}</span>
            <span>{formatearTextoLargo(r)}</span>
          </button>
        );
      })}

      {mostrar && (
        <>
          <div style={styles.quizFeedbackRow}>
          <img
                src={mensaje === "Correcto" ? plantaFeliz : plantaTriste}
                alt=""
                style={styles.quizFeedbackIcono}
              />
            <p style={styles.quizFeedbackTexto}>{mensaje}</p>
          </div>

          {(() => {
            const s = obtenerStats()[String(pregunta.id)];
            if (!s) return null;

            const acertoAhora = mensaje === "Correcto";

            if (acertoAhora) {
              if (s.errores >= 3) {
                return <p style={styles.configSubLabel}>💪 Antes te costaba, pero hoy la has clavado.</p>;
              }
              return null;
            }

            if (s.errores >= 5) return <p style={styles.configSubLabel}>💀 Deja las cervezas y ponte a estudiar.</p>;
            if (s.errores >= 3) return <p style={styles.configSubLabel}>👀 Ya os estáis viendo demasiado tú y esta pregunta</p>;
            return null;
          })()}

          {conExplicacion && (
            <div style={styles.explicacionCaja}>
              <div style={styles.explicacionTituloRow}>
                <img src={iconoExplicacion} alt="" style={styles.explicacionIcono} />
                <b>Explicación:</b>
              </div>
              {renderizarTextoConNegrita(pregunta.explicacion)}
            </div>
          )}

          <button onClick={siguiente} style={styles.ctaButton}>
            Siguiente →
          </button>
        </>
      )}
    </div>
  );
}

// 🌸 Fin del bloque (resultado final)
const rachaFinal = obtenerRacha().racha;

return (
  <div style={styles.menuContainer}>
    <div style={styles.menuHeader}>
      <h1 style={styles.menuTitle}>Fin del bloque</h1>
      <div style={styles.menuUnderline} />
    </div>

    <p style={styles.finBloqueSubtitulo}>¡Buen trabajo, sigue así!</p>
    <p style={styles.finBloqueCorazon}>💗</p>

    <img src={iconoFinBloqueHero} alt="" style={styles.finBloqueHeroImg} />

    <div style={styles.resultCard}>
      <div style={styles.resultRow}>
        <span style={styles.resultRowLabel}>
          <img src={iconoFinAciertos} alt="" style={styles.resultRowIcono} />
          Aciertos
        </span>
        <span style={styles.resultRowValor}>{aciertos} de {preguntas.length}</span>
      </div>
      <div style={styles.resultRow}>
        <span style={styles.resultRowLabel}>
          <img src={iconoFinExpedientes} alt="" style={styles.resultRowIcono} />
          Expedientes resueltos
        </span>
        <span style={styles.resultRowValor}>{expedientesResueltos}</span>   
           </div>
      <div style={{ ...styles.resultRow, borderBottom: "none" }}>
        <span style={styles.resultRowLabel}>
          <img src={iconoFinRacha} alt="" style={styles.resultRowIcono} />
          Racha activa
        </span>
        <span style={styles.resultRowValor}>{rachaFinal} días</span>
      </div>
    </div>

    <button onClick={volverMenu} style={styles.ctaButton}>
      Volver al menú
    </button>
  </div>
);
}