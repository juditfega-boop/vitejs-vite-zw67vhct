import { useState, useEffect } from "react";
import { styles, globalStyles } from "../estilos";
import muerteImg0 from "../assets/trabajadora-0.png";
import muerteImg1 from "../assets/trabajadora-1.png";
import muerteImg2 from "../assets/trabajadora-2.png";
import muerteImg3 from "../assets/trabajadora-3.png";
import muerteImgDerrota from "../assets/trabajadora-derrota.png";
import muerteImgVictoria from "../assets/trabajadora-victoria.png";
import heroSalvaTrabajadora from "../assets/kit/hero-salva-trabajadora.png";
import iconoAciertoCheck from "../assets/kit/icono-fin-aciertos.png";
import iconoPregunta from "../assets/bookbrand/icono-brand-pregunta.png";
import iconoErrorX from "../assets/kit/icono-sim-errores.png";
import iconoTrofeo from "../assets/bookbrand/icono-brand-trofeo.png";
import registroPersonajes from "../personajes/registroPersonajes";
import { obtenerPersonajeActivo } from "../personajes/personajeActivo";
import ImpugnarPregunta from "../componentes/ImpugnarPregunta";
import BuscadorBloques, { filtrarBloques } from "../componentes/BuscadorBloques";
import { renderizarTextoConNegrita } from "../utils/renderizarTexto";
import EscenaMary from "./EscenaMary";

import {
  registrarRespuesta,
  actualizarRacha
} from "../servicios/progreso";

const FRASES_DERROTA_MUERTE = [
  "Esta vez la burocracia ganó.",
  "El expediente te ha vencido... por ahora.",
  "Vuelve a intentarlo, la plaza no se rinde tan fácil.",
  "Ni Mary Richmond pudo con tanto papeleo de golpe."
];

// 🔀 utilidades locales (copias de las de App.jsx, para no depender de él)
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

function imagenMuerteSubita(aciertos) {
  const etapa = Math.min(3, Math.floor(aciertos / 5));
  return [muerteImg0, muerteImg1, muerteImg2, muerteImg3][etapa];
}

// las tres píldoras de vidas caben en una línea
const PILDORA_VIDAS = { flex: 1, padding: "8px 6px", fontSize: 13, whiteSpace: "nowrap", textAlign: "center" };

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
  const [preguntaFallida, setPreguntaFallida] = useState(null);
  const [respuestaFallidaIndice, setRespuestaFallidaIndice] = useState(null);
  const [mostrarPorQueMurio, setMostrarPorQueMurio] = useState(false);

  const [modoVidas, setModoVidas] = useState("subita"); // "subita" | "1vida" | "2vidas"
  const [ayudaActiva, setAyudaActiva] = useState(false);
  const [vidasRestantes, setVidasRestantes] = useState(0);
  const [ayudaDisponible, setAyudaDisponible] = useState(false);
  const [respuestaDescartada, setRespuestaDescartada] = useState(null);
  const [conExplicacion, setConExplicacion] = useState(true); // mostrar la explicación al responder
  const [rescate, setRescate] = useState(null); // sin vidas: la respuesta fallada mientras Mary ofrece su ayuda
  const [buscarBloqueMuerte, setBuscarBloqueMuerte] = useState("");
  const [enPausa, setEnPausa] = useState(false);
  const [derrumbando, setDerrumbando] = useState(false); // la pila se está cayendo (animación de derrota)
  const [eventoEscena, setEventoEscena] = useState(null);
  // 📱 en pantallas estrechas, Mary va encima de las respuestas (más grande)
  const [pantallaEstrecha, setPantallaEstrecha] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const medir = () => setPantallaEstrecha(window.innerWidth < 640);
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  function lanzarEscena(tipo) {
    setEventoEscena((e) => ({ tipo, id: (e?.id || 0) + 1 }));
  }

  const personajeActivo = registroPersonajes[obtenerPersonajeActivo()] || registroPersonajes["ander-egg"];

  function fallosPermitidos(modo) {
    if (modo === "1vida") return 1;
    if (modo === "2vidas") return 2;
    return 0; // muerte súbita
  }

  function pedirAyuda() {
    if (!ayudaDisponible || muerteMostrar) return;
    const pregunta = muertePreguntas[muerteIndice];
    const opcionesIncorrectas = pregunta.respuestas
      .map((_, i) => i)
      .filter((i) => i !== pregunta.correcta);
    const elegida = opcionesIncorrectas[Math.floor(Math.random() * opcionesIncorrectas.length)];
    setRespuestaDescartada(elegida);
    setAyudaDisponible(false);
  }

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
    setPreguntaFallida(null);
    setRespuestaFallidaIndice(null);
    setMostrarPorQueMurio(false);
    setVidasRestantes(fallosPermitidos(modoVidas));
    setAyudaDisponible(ayudaActiva);
    setRespuestaDescartada(null);
    setRescate(null);
    setEnPausa(false);
    setDerrumbando(false);
    setEventoEscena(null);
    setVista("jugando");
  }

  function perderMuerte(pregunta, indiceElegido) {
    if (derrumbando) return;
    setFraseDerrota(
      FRASES_DERROTA_MUERTE[Math.floor(Math.random() * FRASES_DERROTA_MUERTE.length)]
    );
    setPreguntaFallida(pregunta || null);
    setRespuestaFallidaIndice(typeof indiceElegido === "number" ? indiceElegido : null);
    setMuerteRespuestaSeleccionada(typeof indiceElegido === "number" ? indiceElegido : null);
    setMostrarPorQueMurio(false);
    // primero se le cae la pila encima; la pantalla de derrota llega al terminar (onDerrumbe)
    setDerrumbando(true);
    lanzarEscena("derrota");
  }

  function comprobarMuerte(i) {
    if (derrumbando || muerteMostrar) return;
    const pregunta = muertePreguntas[muerteIndice];
    const esCorrecta = i === pregunta.correcta;

    registrarRespuesta(pregunta, esCorrecta);
    actualizarRacha();

    if (esCorrecta) {
      setMuerteRespuestaSeleccionada(i);
      setMuerteMostrar(true);
      setMuerteMensaje("Correcto");
      setMuerteAciertos((a) => a + 1);
      lanzarEscena("acierto");
      return;
    }

    if (vidasRestantes > 0) {
      setVidasRestantes((v) => v - 1);
      setMuerteRespuestaSeleccionada(i);
      setMuerteMostrar(true);
      setMuerteMensaje("Incorrecto");
      lanzarEscena("fallo");
      return;
    }

    // 🤝 sin vidas, pero con la ayuda sin usar: Mary te ofrece quitar esa opción y volver a intentarlo
    if (ayudaDisponible) {
      setRescate(i);
      return;
    }

    perderMuerte(pregunta, i);
  }

  function aceptarRescate() {
    setRespuestaDescartada(rescate);
    setAyudaDisponible(false);
    setRescate(null);
  }

  function rechazarRescate() {
    const fallada = rescate;
    setRescate(null);
    perderMuerte(muertePreguntas[muerteIndice], fallada);
  }

  function siguienteMuerte() {
    console.log("siguienteMuerte llamada, muerteIndice actual:", muerteIndice, "total:", muertePreguntas.length);
    setMuerteMensaje("");
    setMuerteMostrar(false);
    setMuerteRespuestaSeleccionada(null);
    setRespuestaDescartada(null);

    setMuerteIndice((indiceActual) => {
      const siguienteIndice = indiceActual + 1;
      console.log("actualizando muerteIndice", indiceActual, "->", siguienteIndice);

      if (siguienteIndice >= muertePreguntas.length) {
        setVista("victoria");
        return indiceActual;
      }

      setMuerteTiempoRestante(muerteCronometroActivo ? 60 : null);
      return siguienteIndice;
    });
  }

  // ⏱️ cuenta atrás (si el cronómetro está activo)
  useEffect(() => {
    if (vista !== "jugando" || !muerteCronometroActivo || muerteTiempoRestante === null || enPausa || derrumbando || rescate !== null) return;

    if (muerteTiempoRestante <= 0) {
      perderMuerte();
      return;
    }

    const id = setTimeout(() => {
      setMuerteTiempoRestante((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, muerteTiempoRestante, muerteCronometroActivo, enPausa, derrumbando, rescate]);

// ☠️ DETALLE
if (vista === "detalle") {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.quizHeaderRow}>
        <button onClick={() => setPantalla("minijuegos")} style={styles.quizVolverBtn}>
          <span className="hoja-volver"></span>
        </button>
      </div>

      <div style={styles.menuHeader}>
        <span style={styles.juegoDetalleEmojiTitulo}>☠️</span>
        <h1 style={styles.menuTitle}>Salva a tu Trabajadora Social</h1>
        <div style={styles.menuUnderline} />
      </div>

      <img src={heroSalvaTrabajadora} alt="" style={styles.juegoDetalleHeroImg} />

      <div style={styles.configCard}>
          <div style={styles.juegoDetalleFila}>
            <img src={iconoPregunta} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>20 preguntas, una sola vida</p>
          </div>
          <div style={styles.juegoDetalleFila}>
            <img src={iconoErrorX} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>
              Si fallas una, la burocracia gana
            </p>
          </div>
          <div style={{ ...styles.juegoDetalleFila, borderBottom: "none" }}>
            <img src={iconoTrofeo} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>
              Sobrevive a las 20 preguntas y habrás ganado
            </p>
          </div>
        </div>

      <button onClick={() => setVista("config")} style={styles.ctaButton}>
        🚩 Empezar
      </button>

      <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
        <span className="hoja-volver"></span> Volver
      </button>
    </div>
  );
}

  // ⚙️ CONFIGURACIÓN
  if (vista === "config") {
    const bloquesDisponiblesMuerte = filtrarBloques(
      Object.keys(agruparPorBloques(preguntasBase)),
      buscarBloqueMuerte
    );

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
            <>
              <BuscadorBloques valor={buscarBloqueMuerte} onChange={setBuscarBloqueMuerte} />
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
</>
)}

          {!hayPreguntasSuficientesMuerte && (
            <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 8 }}>
              No hay 20 preguntas disponibles con esta selección
              ({listaFuenteMuerte.length} disponibles). Elige más bloques o cambia a general.
            </p>
          )}
        </div>

        <div style={styles.configCard}>
        <p style={styles.configCardTitle}>Vidas</p>
          <div style={{ ...styles.pillGroup, flexWrap: "nowrap" }}>
            <button
              className="pill"
              onClick={() => setModoVidas("subita")}
              style={{ ...styles.pillBtn, ...(modoVidas === "subita" ? styles.pillBtnActiva : {}), ...PILDORA_VIDAS }}
            >
              Muerte súbita
            </button>
            <button
              className="pill"
              onClick={() => setModoVidas("1vida")}
              style={{ ...styles.pillBtn, ...(modoVidas === "1vida" ? styles.pillBtnActiva : {}) }}
            >
              1 vida 
            </button>
            <button
              className="pill"
              onClick={() => setModoVidas("2vidas")}
              style={{ ...styles.pillBtn, ...(modoVidas === "2vidas" ? styles.pillBtnActiva : {}) }}
            >
              2 vidas 
            </button>
          </div>
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
          <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>
              Ayuda de {(personajeActivo.nombre || "").split(" ")[0]}{" "}
              <span style={{ fontWeight: 400, fontSize: 12.5, color: "#8a7d6f" }}>· 1 por partida</span>
            </p>
            <label className="switch">
              <input
                type="checkbox"
                checked={ayudaActiva}
                onChange={() => setAyudaActiva((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
          <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>Mostrar explicación</p>
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

        <div style={styles.configCard}>
          <div style={styles.configRow}>
          <p style={{ ...styles.configCardTitle, marginBottom: 0 }}>
              Cronómetro <span style={{ fontWeight: 400, fontSize: 12.5, color: "#8a7d6f" }}>· 1 min por pregunta</span>
            </p>
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
          <span className="hoja-volver"></span> Volver
        </button>
      </div>
    );
  }

  // ☠️ EN CURSO
  if (vista === "jugando" && muertePreguntas[muerteIndice]) {
    const preguntaMuerte = muertePreguntas[muerteIndice];

    if (enPausa) {
      return (
        <div style={styles.menuContainer}>
          <div style={{ ...styles.configCard, textAlign: "center", marginTop: 40 }}>
            <img
              src={imagenMuerteSubita(muerteAciertos)}
              alt=""
              style={{ width: 140, height: 140, objectFit: "contain", display: "block", margin: "0 auto 12px" }}
            />
            <p style={styles.configCardTitle}>Tu trabajadora se toma un respiro</p>
            <p style={styles.configSubLabel}>
              El reloj está parado en {formatearTiempo(muerteTiempoRestante || 0)}. Vas por la
              pregunta {muerteIndice + 1} de {muertePreguntas.length}.
            </p>
            <button onClick={() => setEnPausa(false)} style={{ ...styles.ctaButton, marginTop: 16 }}>
              Seguir jugando
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.muerteJugandoContainer}>
<div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>
            Pregunta {muerteIndice + 1} / {muertePreguntas.length}
          </span>
          {modoVidas !== "subita" && (
            <span style={styles.simTimer}>❤️ {vidasRestantes}</span>
          )}
          {muerteCronometroActivo && !derrumbando && (
            <button
              onClick={() => setEnPausa(true)}
              title="Pausar"
              style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", ...styles.simTimer }}
            >
              ⏱ {formatearTiempo(muerteTiempoRestante || 0)} ⏸
            </button>
          )}
        </div>

        <h3 style={styles.muertePreguntaTitulo}>{preguntaMuerte.pregunta}</h3>

        <div
          style={{
            ...styles.muerteLayout,
            ...(pantallaEstrecha ? { display: "flex", flexDirection: "column", alignItems: "stretch", gap: 8 } : {})
          }}
        >
          <div
            style={{
              ...styles.muerteImagenCol,
              ...(pantallaEstrecha ? { width: "100%", maxWidth: "100%", flex: "none", display: "flex", justifyContent: "center", margin: "4px 0 8px" } : {})
            }}
          >
            <EscenaMary
              aciertos={muerteAciertos}
              total={muertePreguntas.length}
              evento={eventoEscena}
              onDerrumbe={() => setVista("derrota")}
            />
          </div>

          <div
            style={{
              ...styles.muertePreguntaCol,
              ...(pantallaEstrecha ? { width: "100%", maxWidth: "100%", flex: "none" } : {})
            }}
          >
            {rescate !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#fbf3e6",
                  borderRadius: 20,
                  padding: "12px 14px",
                  marginBottom: 12,
                  boxShadow: "0 3px 10px rgba(0,0,0,0.04)"
                }}
              >
                {personajeActivo.foto && (
                  <img src={personajeActivo.foto} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: "#4a463f", lineHeight: 1.4 }}>
                    ¡Uy! ¿Te echo una mano? Quito esa opción y lo vuelves a intentar.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={aceptarRescate} style={{ ...styles.ctaButton, margin: 0, flex: 2, padding: "10px 12px" }}>
                      Sí, ayúdame
                    </button>
                    <button onClick={rechazarRescate} style={{ ...styles.linkVolver, margin: 0, flex: 1 }}>
                      No, gracias
                    </button>
                  </div>
                </div>
              </div>
            )}

            {ayudaActiva && rescate === null && (
              <div style={{ marginBottom: 10 }}>
                {ayudaDisponible ? (
                  <button
                    onClick={pedirAyuda}
                    disabled={muerteMostrar || derrumbando}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      border: "1.5px dashed #d9c6a8",
                      borderRadius: 18,
                      background: "#fffaf2",
                      padding: "8px 12px",
                      fontFamily: "inherit",
                      fontSize: 14,
                      color: "#5b4a3a",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    {personajeActivo.foto && (
                      <img src={personajeActivo.foto} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
                    )}
                    <span>
                      <b>Pedir ayuda a {personajeActivo.nombre}</b>
                      <span style={{ display: "block", fontSize: 12, color: "#8a7d6f" }}>Quita una opción incorrecta (1 por partida)</span>
                    </span>
                  </button>
                ) : respuestaDescartada !== null ? (
                  <p style={styles.configSubLabel}>
                    {personajeActivo.nombre} descarta la opción {String.fromCharCode(65 + respuestaDescartada)}.
                  </p>
                ) : (
                  <p style={styles.configSubLabel}>Ya has usado tu ayuda en esta partida.</p>
                )}
              </div>
            )}

            {preguntaMuerte.respuestas.map((r, i) => {
              let bg = "#fff";
              if (muerteMostrar && i === preguntaMuerte.correcta) bg = "#d4edda";
              else if ((muerteMostrar || derrumbando) && i === muerteRespuestaSeleccionada) bg = "#f8d7da";

              const descartada = i === respuestaDescartada;

              return (
                <button
                  key={i}
                  onClick={() => comprobarMuerte(i)}
                  disabled={muerteMostrar || descartada || derrumbando || rescate !== null}
                  style={{
                    ...styles.button,
                    background: bg,
                    textAlign: "left",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                    opacity: descartada ? 0.4 : 1,
                    textDecoration: descartada ? "line-through" : "none"
                  }}
                >
                  {formatearTextoLargo(r)}
                </button>
              );
            })}

{muerteMostrar && (
              <>
                <div style={styles.quizFeedbackRow}>
                  <img src={iconoAciertoCheck} alt="" style={styles.quizFeedbackIcono} />
                  <p style={styles.quizFeedbackTexto}>{muerteMensaje}</p>
                </div>

                {conExplicacion && (
                  <div style={styles.explicacionCaja}>
                    <p style={{ margin: 0 }}>
                      <b>Explicación:</b>
                    </p>
                    {renderizarTextoConNegrita(preguntaMuerte.explicacion)}
                  </div>
                )}

                <ImpugnarPregunta pregunta={preguntaMuerte} origen="salva-ts" />

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
    <div style={{ ...styles.derrotaContainer, animation: "aparecerSuave 0.7s ease both" }}>
      <style>{"@keyframes aparecerSuave { from { opacity: 0; } to { opacity: 1; } }"}</style>
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

        {preguntaFallida && !mostrarPorQueMurio && (
          <button
            onClick={() => setMostrarPorQueMurio(true)}
            style={styles.derrotaLinkVolver}
          >
            💀 ¿Quieres saber por qué murió?
          </button>
        )}

{preguntaFallida && mostrarPorQueMurio && (
            <div style={{ ...styles.explicacionCaja, textAlign: "left", marginTop: 10 }}>
              <p style={{ margin: "0 0 10px" }}>
                <b>{preguntaFallida.pregunta}</b>
              </p>
              {preguntaFallida.respuestas.map((r, i) => {
                const esLaQueElegiste = i === respuestaFallidaIndice;
                const esLaCorrecta = i === preguntaFallida.correcta;
                return (
                  <p
                    key={i}
                    style={{
                      margin: "4px 0",
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: esLaCorrecta ? "#d4edda" : esLaQueElegiste ? "#f5c6cb" : "transparent",
                      fontWeight: esLaCorrecta ? 700 : 400
                    }}
                  >
                    {formatearTextoLargo(r)}
                  </p>
                );
              })}
              <div style={{ marginTop: 10 }}>
                {renderizarTextoConNegrita(preguntaFallida.explicacion)}
              </div>
            </div>
          )}

        <button onClick={() => setPantalla("minijuegos")} style={styles.derrotaLinkVolver}>
          <span className="hoja-volver"></span> Volver a minijuegos
        </button>

        <button onClick={volverMenu} style={styles.derrotaLinkVolver}>
          <span className="hoja-volver"></span> Volver al menú
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
          style={{ display: "block", width: 140, margin: "0 auto 16px", animation: "saltoVictoria 0.9s cubic-bezier(0.3, 1.4, 0.5, 1) both" }}
        />
        <style>{"@keyframes saltoVictoria { 0% { opacity: 0; transform: translateY(30px) scale(0.9); } 60% { opacity: 1; transform: translateY(-10px) scale(1.02); } 100% { transform: none; } }"}</style>

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
          <span className="hoja-volver"></span> Volver a minijuegos
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          <span className="hoja-volver"></span> Volver al menú
        </button>
      </div>
    );
  }

  return null;
}