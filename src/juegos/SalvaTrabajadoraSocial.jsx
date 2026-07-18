import { useState, useEffect } from "react";
import { styles, globalStyles } from "../estilos";
import muerteImg0 from "../assets/trabajadora-0.png";
import muerteImg1 from "../assets/trabajadora-1.png";
import muerteImg2 from "../assets/trabajadora-2.png";
import muerteImg3 from "../assets/trabajadora-3.png";
import muerteImgDerrota from "../assets/trabajadora-derrota.png";
import muerteImgVictoria from "../assets/trabajadora-victoria.png";

const CLAVE_STATS = "opo_stats_v1";
const CLAVE_RACHA = "opo_racha_v1";

const FRASES_DERROTA_MUERTE = [
  "Esta vez la burocracia ganó.",
  "El expediente te ha vencido... por ahora.",
  "Vuelve a intentarlo, la plaza no se rinde tan fácil.",
  "Ni Mary Richmond pudo con tanto papeleo de golpe."
];

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
    stats[id] = { id, bloque: pregunta.bloque || "Sin bloque", aciertos: 0, errores: 0, veces: 0 };
  }

  stats[id].veces += 1;
  if (correcta) {
    stats[id].aciertos += 1;
  } else {
    stats[id].errores += 1;
  }

  guardarStats(stats);
}

function obtenerRacha() {
  return JSON.parse(localStorage.getItem(CLAVE_RACHA)) || { ultimaFecha: null, racha: 0 };
}

function actualizarRacha() {
  const hoy = new Date().toISOString().slice(0, 10);
  const datos = obtenerRacha();

  if (datos.ultimaFecha === hoy) return;

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().slice(0, 10);

  const nuevaRacha = datos.ultimaFecha === ayerStr ? datos.racha + 1 : 1;

  localStorage.setItem(CLAVE_RACHA, JSON.stringify({ ultimaFecha: hoy, racha: nuevaRacha }));
}

function imagenMuerteSubita(aciertos) {
  const etapa = Math.min(3, Math.floor(aciertos / 5));
  return [muerteImg0, muerteImg1, muerteImg2, muerteImg3][etapa];
}

// ☠️ "Salva a tu trabajadora social" — componente independiente y autocontenido.
export default function SalvaTrabajadoraSocial({ preguntasBase, setPantalla, volverMenu }) {
  const [vista, setVista] = useState("detalle"); // detalle|config|jugando|derrota|victoria

  const [muerteTipo, setMuerteTipo] = useState("general");
  const [muerteBloquesSeleccionados, setMuerteBloquesSeleccionados] = useState([]);
  const [muerteCronometroActivo, setMuerteCronometroActivo] = useState(false);
  const [muertePreguntas, setMuertePreguntas] = useState([]);
  const [muerteIndice, setMuerteIndice] = useState(0);
  const [muerteAciertos, setMuerteAciertos] = useState(0);
  const [muerteMensaje, setMuerteMensaje] = useState("");
  const [muerteMostrar, setMuerteMostrar] = useState(false);
  const [muerteTiempoRestante, setMuerteTiempoRestante] = useState(null);
  const [muerteRespuestaSeleccionada, setMuerteRespuestaSeleccionada] = useState(null);
  const [fraseDerrota, setFraseDerrota] = useState("");

  function toggleBloqueMuerte(nombre) {
    setMuerteBloquesSeleccionados((prev) =>
      prev.includes(nombre) ? prev.filter((b) => b !== nombre) : [...prev, nombre]
    );
  }

  function comenzarMuerteSubita() {
    let listaFuente = preguntasBase;

    if (muerteTipo === "bloques") {
      listaFuente = preguntasBase.filter((p) =>
        muerteBloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const base = mezclar(listaFuente).slice(0, 20).map(prepararPregunta);

    setMuertePreguntas(base);
    setMuerteIndice(0);
    setMuerteAciertos(0);
    setMuerteMensaje("");
    setMuerteMostrar(false);
    setMuerteRespuestaSeleccionada(null);
    setMuerteTiempoRestante(muerteCronometroActivo ? 60 : null);
    setVista("jugando");
  }

  function perderMuerte() {
    setFraseDerrota(
      FRASES_DERROTA_MUERTE[Math.floor(Math.random() * FRASES_DERROTA_MUERTE.length)]
    );
    setVista("derrota");
  }

  function comprobarMuerte(i) {
    const pregunta = muertePreguntas[muerteIndice];
    const esCorrecta = i === pregunta.correcta;

    registrarRespuesta(pregunta, esCorrecta);
    actualizarRacha();

    if (esCorrecta) {
      setMuerteRespuestaSeleccionada(i);
      setMuerteMostrar(true);
      setMuerteMensaje("✅ Correcto");
      setMuerteAciertos((a) => a + 1);
    } else {
      perderMuerte();
    }
  }

  function siguienteMuerte() {
    setMuerteMensaje("");
    setMuerteMostrar(false);
    setMuerteRespuestaSeleccionada(null);

    const siguienteIndice = muerteIndice + 1;

    if (siguienteIndice >= muertePreguntas.length) {
      setVista("victoria");
    } else {
      setMuerteIndice(siguienteIndice);
      setMuerteTiempoRestante(muerteCronometroActivo ? 60 : null);
    }
  }

  // ⏱️ cuenta atrás (si el cronómetro está activo)
  useEffect(() => {
    if (vista !== "jugando" || !muerteCronometroActivo || muerteTiempoRestante === null) return;

    if (muerteTiempoRestante <= 0) {
      perderMuerte();
      return;
    }

    const id = setTimeout(() => {
      setMuerteTiempoRestante((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, muerteTiempoRestante, muerteCronometroActivo]);

  // ☠️ DETALLE
  if (vista === "detalle") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>☠️ Salva a tu trabajadora social</h1>
          <div style={styles.menuUnderline} />
        </div>

        <p style={styles.configSubLabel}>
          20 preguntas, una sola vida. Si fallas una, la burocracia gana.
          ¿Cuántas serás capaz de acertar seguidas?
        </p>

        <button onClick={() => setVista("config")} style={styles.ctaButton}>
          Jugar
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // ⚙️ CONFIGURACIÓN
  if (vista === "config") {
    const bloquesDisponiblesMuerte = Object.keys(agruparPorBloques(preguntasBase));

    let listaFuenteMuerte = preguntasBase;
    if (muerteTipo === "bloques") {
      listaFuenteMuerte = preguntasBase.filter((p) =>
        muerteBloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const hayPreguntasSuficientesMuerte = listaFuenteMuerte.length >= 20;

    const puedeEmpezarMuerte =
      (muerteTipo === "general" || muerteBloquesSeleccionados.length > 0) &&
      hayPreguntasSuficientesMuerte;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>☠️ Salva a tu trabajadora social</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Preguntas</p>
          <div style={styles.pillGroup}>
            <button
              className="pill"
              onClick={() => setMuerteTipo("general")}
              style={{
                ...styles.pillBtn,
                ...(muerteTipo === "general" ? styles.pillBtnActiva : {})
              }}
            >
              General
            </button>
            <button
              className="pill"
              onClick={() => setMuerteTipo("bloques")}
              style={{
                ...styles.pillBtn,
                ...(muerteTipo === "bloques" ? styles.pillBtnActiva : {})
              }}
            >
              Por bloques
            </button>
          </div>

          {muerteTipo === "bloques" && (
            <div style={styles.bloquesGrid}>
              {bloquesDisponiblesMuerte.map((b) => (
                <button
                  key={b}
                  className="bloque-chip"
                  onClick={() => toggleBloqueMuerte(b)}
                  style={{
                    ...styles.bloqueChip,
                    ...(muerteBloquesSeleccionados.includes(b) ? styles.bloqueChipActiva : {})
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          {!hayPreguntasSuficientesMuerte && (
            <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 8 }}>
              No hay 20 preguntas disponibles con esta selección
              ({listaFuenteMuerte.length} disponibles). Elige más bloques o cambia a general.
            </p>
          )}
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Activar cronómetro (1 min / pregunta)</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={muerteCronometroActivo}
                onChange={() => setMuerteCronometroActivo((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button
          onClick={comenzarMuerteSubita}
          disabled={!puedeEmpezarMuerte}
          style={{
            ...styles.ctaButton,
            ...(puedeEmpezarMuerte ? {} : styles.ctaButtonDisabled)
          }}
        >
          Empezar
        </button>

        <button onClick={() => setVista("detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // ☠️ EN CURSO
  if (vista === "jugando" && muertePreguntas[muerteIndice]) {
    const preguntaMuerte = muertePreguntas[muerteIndice];

    return (
      <div style={styles.muerteJugandoContainer}>
        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>
            Pregunta {muerteIndice + 1} / {muertePreguntas.length}
          </span>
          {muerteCronometroActivo && (
            <span style={styles.simTimer}>
              ⏱ {formatearTiempo(muerteTiempoRestante || 0)}
            </span>
          )}
        </div>

        <h3 style={styles.muertePreguntaTitulo}>{preguntaMuerte.pregunta}</h3>

        <div style={styles.muerteLayout}>
          <div style={styles.muerteImagenCol}>
            <img
              src={imagenMuerteSubita(muerteAciertos)}
              alt="Tu trabajadora social"
              style={styles.muerteImagen}
            />
          </div>

          <div style={styles.muertePreguntaCol}>
            {preguntaMuerte.respuestas.map((r, i) => {
              let bg = "#fff";
              if (muerteMostrar && i === preguntaMuerte.correcta) bg = "#d4edda";

              return (
                <button
                  key={i}
                  onClick={() => comprobarMuerte(i)}
                  disabled={muerteMostrar}
                  style={{
                    ...styles.button,
                    background: bg,
                    textAlign: "left",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line"
                  }}
                >
                  {formatearTextoLargo(r)}
                </button>
              );
            })}

            {muerteMostrar && (
              <>
                <p>{muerteMensaje}</p>

                <div style={styles.explicacionCaja}>
                  <p style={{ margin: 0 }}>
                    <b>Explicación:</b>
                  </p>
                  {renderizarTextoConNegrita(preguntaMuerte.explicacion)}
                </div>

                <button onClick={siguienteMuerte} style={styles.button}>
                  Siguiente →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ☠️ DERROTA
  if (vista === "derrota") {
    return (
      <div style={styles.derrotaContainer}>
        <img src={muerteImgDerrota} alt="La burocracia gana" style={styles.derrotaImagenFondo} />

        <p style={styles.derrotaTituloTop}>
          LA BUROCRACIA ACABÓ CON MARY ELLEN RICHMOND Y TÚ ERES RESPONSABLE
          POR NO HABER ESTUDIADO
        </p>

        <div style={styles.derrotaOverlayInferior}>
          <button onClick={comenzarMuerteSubita} style={styles.derrotaBoton}>
            Inténtalo de nuevo
          </button>

          <p style={styles.derrotaSubtitulo}>
            Llegaste a la pregunta {muerteIndice + 1} / {muertePreguntas.length}
          </p>

          <button onClick={() => setPantalla("minijuegos")} style={styles.derrotaLinkVolver}>
            ⬅ Volver a minijuegos
          </button>

          <button onClick={volverMenu} style={styles.derrotaLinkVolver}>
            ⬅ Volver al menú
          </button>
        </div>
      </div>
    );
  }

// 🎉 VICTORIA
if (vista === "victoria") {
    return (
      <div style={styles.menuContainer}>
        <img
          src={muerteImgVictoria}
          alt="Has sobrevivido"
          style={{ display: "block", width: 140, margin: "0 auto 16px" }}
        />

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>🎉 ¡Has sobrevivido!</h1>
          <div style={styles.menuUnderline} />
        </div>

        <p style={{ textAlign: "center", color: "#8a8578" }}>
          20 de 20 preguntas acertadas. La burocracia, esta vez, ha perdido.
        </p>

        <button onClick={comenzarMuerteSubita} style={styles.ctaButton}>
          Jugar otra vez
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver a minijuegos
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  return null;
}