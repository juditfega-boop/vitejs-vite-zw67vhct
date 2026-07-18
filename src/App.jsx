import { useEffect, useRef, useState } from "react";
import { cargarPreguntas } from "./cargarPreguntas";
import portada from "./assets/portada.jpeg";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { ESTRUCTURA_CONSTITUCION } from "./construyeConstitucion";
import miniaturaArchivos from "./assets/archivos-miniatura.png";
import miniaturaConstruye from "./assets/construye-miniatura.png";
import miniaturaCarreraPlaza from "./assets/carrera-miniatura.jpg";
import { globalStyles, styles } from "./estilos";
import ConstruyeConstitucion from "./juegos/ConstruyeConstitucion";
import ConectaConstitucion from "./juegos/ConectaConstitucion";
import CarreraPlaza from "./juegos/CarreraPlaza";
import SalvaTrabajadoraSocial from "./juegos/SalvaTrabajadoraSocial";
import muerteImg0 from "./assets/trabajadora-0.png";


import {
  obtenerStats,
  guardarStats,
  registrarRespuesta,
  obtenerRacha,
  actualizarRacha,
  obtenerTiempos,
  registrarTiempoPregunta,
  obtenerFavoritos,
  guardarFavoritos,
  CLAVE_CODIGO
} from "./servicios/progreso";

// ⏱️ duración total del simulacro oficial (minutos). Ajusta este número si quieres otro tiempo.
const DURACION_SIMULACRO_MINUTOS = 100;

// 📌 Array de frases de bienvenida — añade aquí nuevas cuando quieras
const FRASES_BIENVENIDA = [
  "venimos de personas que con la poesía cambiaron el mundo",
  "me declaro aprendiz imperecedera",
  "el conocimiento también se construye en sociedad"
];

// 🎮 frases graciosas para el minijuego "Carrera por la Plaza"

// ☠️ frases de derrota para "Salva a tu trabajadora social"


export default function App() {
  const [preguntasBase, setPreguntasBase] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [pantalla, setPantalla] = useState("landing");
  const [mensaje, setMensaje] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [cantidad, setCantidad] = useState(20);

  // 👈 frase de portada, elegida una sola vez al abrir la app
  const [frase] = useState(
    () => FRASES_BIENVENIDA[Math.floor(Math.random() * FRASES_BIENVENIDA.length)]
  );

  // 🧭 configuración de la pantalla "Estudiar"
  const [tipoEstudio, setTipoEstudio] = useState("general"); // "general" | "bloques"
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [tipoCronometro, setTipoCronometro] = useState("auto"); // "auto" | "personalizado"
  const [minutosPersonalizados, setMinutosPersonalizados] = useState(20);
  const [conExplicacion, setConExplicacion] = useState(true);

  // ⏱️ temporizador del estudio (null = sin cronómetro)
  const [tiempoRestante, setTiempoRestante] = useState(null);

  // 📝 estado del simulacro oficial
  const [respuestasSimulacro, setRespuestasSimulacro] = useState([]);
  const [tiempoRestanteSimulacro, setTiempoRestanteSimulacro] = useState(null);
  const [horaInicioSimulacro, setHoraInicioSimulacro] = useState(null);
  const [resultadoSimulacro, setResultadoSimulacro] = useState(null);

  // ⏱️ instante en que se mostró la pregunta actual (para tiempo medio)
  const [inicioPregunta, setInicioPregunta] = useState(null);

  // ⭐ favoritos (persisten en localStorage, no afectan a la lógica del quiz)
  const [favoritos, setFavoritos] = useState(() => obtenerFavoritos());

  function toggleFavorito(id) {
    setFavoritos((prev) => {
      const idStr = String(id);
      const nuevo = prev.includes(idStr)
        ? prev.filter((f) => f !== idStr)
        : [...prev, idStr];
      guardarFavoritos(nuevo);
      return nuevo;
    });
    sincronizarConNube();
  }


  // ☁️ código personal para sincronizar el progreso entre dispositivos
  const [codigo, setCodigo] = useState(
    () => localStorage.getItem(CLAVE_CODIGO) || ""
  );
  const [codigoInput, setCodigoInput] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeSync, setMensajeSync] = useState("");

  async function cargarDesdeNube(cod) {
    setSincronizando(true);
    setMensajeSync("");

    try {
      const snap = await getDoc(doc(db, "perfiles", cod));

      if (snap.exists()) {
        const datos = snap.data();

        if (datos.stats) guardarStats(datos.stats);
        if (datos.racha) localStorage.setItem(CLAVE_RACHA, JSON.stringify(datos.racha));
        if (datos.tiempos) localStorage.setItem(CLAVE_TIEMPOS, JSON.stringify(datos.tiempos));
        if (datos.favoritos) {
          guardarFavoritos(datos.favoritos);
          setFavoritos(datos.favoritos);
        }

        setMensajeSync("✅ Progreso cargado desde tu código.");
      } else {
        await sincronizarConNube(cod);
        setMensajeSync("🆕 Código nuevo: se ha guardado tu progreso actual con este código.");
      }
    } catch (e) {
      setMensajeSync("⚠️ No se pudo conectar. Comprueba tu conexión a internet.");
    }

    setSincronizando(false);
  }

  async function sincronizarConNube(codigoForzado) {
    const cod = codigoForzado || codigo;
    if (!cod) return;

    const datos = {
      stats: obtenerStats(),
      racha: obtenerRacha(),
      tiempos: obtenerTiempos(),
      favoritos: obtenerFavoritos(),
      actualizado: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "perfiles", cod), datos);
    } catch (e) {
      // fallo silencioso: los datos siguen a salvo en localStorage
    }
  }

  function guardarCodigo() {
    const cod = codigoInput.trim().toLowerCase();
    if (!cod) return;

    setCodigo(cod);
    localStorage.setItem(CLAVE_CODIGO, cod);
    setCodigoInput("");
    cargarDesdeNube(cod);
  }

  function borrarCodigo() {
    setCodigo("");
    localStorage.removeItem(CLAVE_CODIGO);
    setMensajeSync("");
  }


  useEffect(() => {
    async function init() {
      const datos = await cargarPreguntas();
      setPreguntasBase(datos);
    }
    init();
  }, []);

  // ☁️ si ya hay un código guardado en este dispositivo, carga el progreso al abrir la app
  useEffect(() => {
    if (codigo) {
      cargarDesdeNube(codigo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 🕐 marca el inicio de cada pregunta nueva, para poder medir tiempo medio
  useEffect(() => {
    if (pregunta) {
      setInicioPregunta(Date.now());
    }
  }, [pregunta]);

  // ⏱️ cuenta atrás del cronómetro de estudio
  useEffect(() => {
    if (pantalla !== "quiz" || tiempoRestante === null) return;

    if (tiempoRestante <= 0) {
      setTiempoRestante(null);
      setPantalla("resultado");
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestante((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [pantalla, tiempoRestante]);

  // ⏱️ cuenta atrás del simulacro oficial
  useEffect(() => {
    if (pantalla !== "simulacro" || tiempoRestanteSimulacro === null) return;

    if (tiempoRestanteSimulacro <= 0) {
      finalizarSimulacro();
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestanteSimulacro((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [pantalla, tiempoRestanteSimulacro]);


  // 📁 cuando las 8 parejas están resueltas, pasa a la pantalla de resultado

  function volverMenu() {
    setPantalla("inicio");
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
    setTiempoRestante(null);
    setTiempoRestanteSimulacro(null);
    sincronizarConNube();
  }

  function volverProgreso() {
    setPantalla("progreso");
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
    sincronizarConNube();
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
    setTiempoRestante(null);
    setConExplicacion(true);
    actualizarRacha();
    setPantalla("quiz");
  }

  // ⚙️ construir sesión de estudio a partir de la configuración elegida
  function comenzarEstudioPersonalizado() {
    let listaFuente = preguntasBase;

    if (tipoEstudio === "bloques") {
      listaFuente = preguntasBase.filter((p) =>
        bloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const base = mezclar(listaFuente)
      .slice(0, cantidad)
      .map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);

    if (cronometroActivo) {
      const minutos =
        tipoCronometro === "auto" ? cantidad : (minutosPersonalizados || 1);
      setTiempoRestante(minutos * 60);
    } else {
      setTiempoRestante(null);
    }

    actualizarRacha();
    setPantalla("quiz");
  }

  function toggleBloqueSeleccionado(nombre) {
    setBloquesSeleccionados((prev) =>
      prev.includes(nombre)
        ? prev.filter((b) => b !== nombre)
        : [...prev, nombre]
    );
  }

  // 📝 crear simulacro oficial (100 preguntas)
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
    setRespuestasSimulacro(new Array(examenFinal.length).fill(null));
    setTiempoRestanteSimulacro(DURACION_SIMULACRO_MINUTOS * 60);
    setHoraInicioSimulacro(Date.now());
    setResultadoSimulacro(null);
    actualizarRacha();
    setPantalla("simulacro");
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

    preguntas.forEach((p, i) => {
      const r = respuestasSimulacro[i];

      if (r === null || r === undefined) {
        blancosF++;
      } else if (r === p.correcta) {
        aciertosF++;
        registrarRespuesta(p, true);
      } else {
        erroresF++;
        registrarRespuesta(p, false);
      }
    });

    const notaBruta = aciertosF * 1 - erroresF * (1 / 3);
    const nota = Math.max(0, notaBruta);

    const segundosEmpleados = horaInicioSimulacro
      ? Math.round((Date.now() - horaInicioSimulacro) / 1000)
      : 0;

    setResultadoSimulacro({
      nota: nota.toFixed(2),
      aciertos: aciertosF,
      errores: erroresF,
      blancos: blancosF,
      tiempo: formatearTiempo(segundosEmpleados)
    });

    setTiempoRestanteSimulacro(null);
    sincronizarConNube();
    setPantalla("resultado-simulacro");
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
    setTiempoRestante(null);
    setConExplicacion(true);
    actualizarRacha();
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

      if (s.aciertos >= s.errores && s.errores > 0) {
        recuperadas.push(p);
      }
      else if (s.errores >= 3) {
        muyOlvidadas.push(p);
      }
      else if (s.errores > s.aciertos) {
        pendientes.push(p);
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

    if (inicioPregunta) {
      const segundos = Math.round((Date.now() - inicioPregunta) / 1000);
      registrarTiempoPregunta(segundos);
    }

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
    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Menú principal</h1>
          <div style={styles.menuUnderline} />
        </div>

        <button
          className="menu-btn"
          onClick={() => setPantalla("estudiar-config")}
          style={{ ...styles.menuButton, ...styles.btnPeach }}
        >
          📖 Estudiar
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("simulacro-intro")}
          style={{ ...styles.menuButton, ...styles.btnPurple }}
        >
          📝 Simulacro oficial
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("progreso")}
          style={{ ...styles.menuButton, ...styles.btnPink }}
        >
          📈 Mi evolución
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("desarrollo")}
          style={{ ...styles.menuButton, ...styles.btnMuted }}
        >
          🧩 Desarrollo <span style={styles.badgeProximamente}>Próximamente</span>
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("minijuegos")}
          style={{ ...styles.menuButton, ...styles.btnMint }}
        >
          🎮 Minijuegos
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("ajustes")}
          style={{ ...styles.menuButton, ...styles.btnOlive }}
        >
          👤 Mi perfil
        </button>
      </div>
    );
  }

  // ⚙️ CONFIGURACIÓN DE ESTUDIO
  if (pantalla === "estudiar-config") {
    const bloquesDisponibles = Object.keys(agruparPorBloques(preguntasBase));
    const puedeComenzar =
      tipoEstudio === "general" || bloquesSeleccionados.length > 0;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Estudiar</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Tipo de estudio</p>
          <div style={styles.pillGroup}>
            <button
              className="pill"
              onClick={() => setTipoEstudio("general")}
              style={{
                ...styles.pillBtn,
                ...(tipoEstudio === "general" ? styles.pillBtnActiva : {})
              }}
            >
              Estudio general
            </button>
            <button
              className="pill"
              onClick={() => setTipoEstudio("bloques")}
              style={{
                ...styles.pillBtn,
                ...(tipoEstudio === "bloques" ? styles.pillBtnActiva : {})
              }}
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
                    ...(bloquesSeleccionados.includes(b)
                      ? styles.bloqueChipActiva
                      : {})
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Número de preguntas</p>
          <div style={styles.pillGroup}>
            {[10, 20, 30, 50, 100].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => setCantidad(n)}
                style={{
                  ...styles.pillBtn,
                  ...(cantidad === n ? styles.pillBtnActiva : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Activar cronómetro</p>
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
              <div style={styles.pillGroup}>
                <button
                  className="pill"
                  onClick={() => setTipoCronometro("auto")}
                  style={{
                    ...styles.pillBtn,
                    ...(tipoCronometro === "auto" ? styles.pillBtnActiva : {})
                  }}
                >
                  1 min / pregunta
                </button>
                <button
                  className="pill"
                  onClick={() => setTipoCronometro("personalizado")}
                  style={{
                    ...styles.pillBtn,
                    ...(tipoCronometro === "personalizado"
                      ? styles.pillBtnActiva
                      : {})
                  }}
                >
                  Personalizado
                </button>
              </div>

              {tipoCronometro === "personalizado" && (
                <div style={{ marginTop: 10 }}>
                  <label style={styles.configSubLabel}>
                    Minutos totales:{" "}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minutosPersonalizados}
                    onChange={(e) =>
                      setMinutosPersonalizados(Number(e.target.value))
                    }
                    style={styles.numeroInput}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Mostrar explicación al responder</p>
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
          style={{
            ...styles.ctaButton,
            ...(puedeComenzar ? {} : styles.ctaButtonDisabled)
          }}
        >
          Comenzar estudio
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // 📝 INTRO DEL SIMULACRO OFICIAL
  if (pantalla === "simulacro-intro") {
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
            <span>✅ Acierto</span>
            <b>+1 punto</b>
          </div>
          <div style={styles.resultRow}>
            <span>❌ Error</span>
            <b>−1/3 punto</b>
          </div>
          <div style={{ ...styles.resultRow, borderBottom: "none" }}>
            <span>⬜ En blanco</span>
            <b>No penaliza</b>
          </div>
        </div>

        <p style={styles.configSubLabel}>
          Puedes dejar preguntas en blanco y volver a ellas más adelante,
          mientras te quede tiempo.
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

  // 📝 SIMULACRO OFICIAL — EN CURSO
  if (pantalla === "simulacro" && pregunta) {
    const respondidas = respuestasSimulacro.filter(
      (r) => r !== null && r !== undefined
    ).length;

    return (
      <div style={styles.menuContainer}>
        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>
            ⏱ {formatearTiempo(tiempoRestanteSimulacro || 0)}
          </span>
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
                ...(respuestasSimulacro[i] !== null &&
                respuestasSimulacro[i] !== undefined
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
              ...(respuestasSimulacro[indice] === i
                ? styles.simRespuestaSeleccionada
                : {})
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

  // 🏁 RESULTADO DEL SIMULACRO
  if (pantalla === "resultado-simulacro" && resultadoSimulacro) {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Resultado del simulacro</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.resultCard}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#8a8578" }}>Nota final</span>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#4a463f" }}>
              {resultadoSimulacro.nota}
            </div>
          </div>

          <div style={styles.resultRow}>
            <span>✅ Aciertos</span>
            <b>{resultadoSimulacro.aciertos}</b>
          </div>
          <div style={styles.resultRow}>
            <span>❌ Errores</span>
            <b>{resultadoSimulacro.errores}</b>
          </div>
          <div style={styles.resultRow}>
            <span>⬜ En blanco</span>
            <b>{resultadoSimulacro.blancos}</b>
          </div>
          <div style={{ ...styles.resultRow, borderBottom: "none" }}>
            <span>⏱ Tiempo empleado</span>
            <b>{resultadoSimulacro.tiempo}</b>
          </div>
        </div>

        <button onClick={volverMenu} style={styles.ctaButton}>
          Volver al menú
        </button>
      </div>
    );
  }

  // 📈 MI PROGRESO (hub)
  if (pantalla === "progreso") {
    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Mi progreso</h1>
          <div style={styles.menuUnderline} />
        </div>

        <button
          className="menu-btn"
          onClick={() => setPantalla("estadisticas")}
          style={{ ...styles.menuButton, ...styles.btnPeach }}
        >
          📊 Estadísticas
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
          onClick={() => setPantalla("favoritos")}
          style={{ ...styles.menuButton, ...styles.btnOlive }}
        >
          ❤️ Favoritas ({favoritos.length})
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // ❤️ PREGUNTAS FAVORITAS
  if (pantalla === "favoritos") {
    const listaFavoritas = preguntasBase.filter((p) =>
      favoritos.includes(String(p.id))
    );

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>❤️ Favoritas</h1>
          <div style={styles.menuUnderline} />
        </div>

        {listaFavoritas.length === 0 ? (
          <p style={styles.configSubLabel}>
            Aún no has marcado ninguna pregunta con ⭐. Puedes hacerlo desde
            cualquier pregunta durante el estudio.
          </p>
        ) : (
          <>
            <p style={styles.configSubLabel}>
              Tienes {listaFavoritas.length} pregunta
              {listaFavoritas.length === 1 ? "" : "s"} guardada
              {listaFavoritas.length === 1 ? "" : "s"}.
            </p>

            <button
              onClick={() => iniciarBloque(listaFavoritas)}
              style={styles.ctaButton}
            >
              Repasar favoritas
            </button>
          </>
        )}

        <button onClick={volverProgreso} style={styles.linkVolver}>
          ⬅ Volver
        </button>
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
            🔴 Casos prioritarios ({muyOlvidadas.length})
          </h3>

          <p>
            Estas preguntas requieren de intervención urgente
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
            🟡 Casos en seguimiento ({pendientes.length})
          </h3>

          <p>
            Sigues con el expediente abierto
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
            🟢 Casos resueltos ({recuperadas.length})
          </h3>

          <p>
            Intervención finalizada: autonomía conseguida
          </p>

          <button
            style={styles.button}
            onClick={() => iniciarBloque(recuperadas)}
          >
            Repasar
          </button>

        </div>

        <button
          onClick={volverProgreso}
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
        return "🎓 Nivel Jane Addams: podrías montar tu propia Hull House";

      if (p >= 75)
        return "💪 Caso con alta autonomía, casi de alta";

      if (p >= 60)
        return "🙂 Vas bien, aunque el expediente aún tiene puntos abiertos";

      if (p >= 40)
        return "⚠️ Este bloque necesita un plan de intervención en condiciones";

      if (p >= 20)
        return "🚨 Caso de alta vulnerabilidad — hay que reforzar la red de apoyo (o sea, estudiar más)";

      return "🆘 Esto es una urgencia social: deriva este bloque a estudio inmediato";
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

    const racha = obtenerRacha().racha;
    const tiempos = obtenerTiempos();
    const tiempoMedio =
      tiempos.totalPreguntas > 0
        ? Math.round(tiempos.totalSegundos / tiempos.totalPreguntas)
        : 0;
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
            <div style={styles.statValue}>
              {tiempoMedio ? `${tiempoMedio}s` : "—"}
            </div>
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

          <p>
            Todavía no has respondido preguntas 😅
          </p>

        ) : (

          <>
            {ordenados.map((b)=>(
              <div
                key={b.nombre}
                style={{
                  border:"1px solid #ddd",
                  padding:10,
                  marginTop:10,
                  borderRadius:10,
                  background: "#fff"
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
          onClick={volverProgreso}
          style={styles.linkVolver}
        >
          ⬅ Volver
        </button>

      </div>
    );
  }

  // 🧩 DESARROLLO (próximamente)
  if (pantalla === "desarrollo") {
    return (
      <div style={styles.placeholderContainer}>
        <div style={styles.placeholderCard}>
          <div style={styles.placeholderEmoji}>🧩</div>
          <h2>Desarrollo</h2>
          <p style={styles.configSubLabel}>Próximamente</p>
          <button onClick={volverMenu} style={styles.linkVolver}>
            ⬅ Volver al menú
          </button>
        </div>
      </div>
    );
  }

  // 🎮 HUB DE MINIJUEGOS
  if (pantalla === "minijuegos") {
    const listaMinijuegos = [
      {
        id: "carrera",
        nombre: "Carrera por la Plaza",
        miniatura: miniaturaCarreraPlaza,
        destino: "carrera"
      },
      {
        id: "muerte",
        nombre: "Salva a tu trabajadora social",
        miniatura: muerteImg0,
        destino: "muerte"
      },
      {
        id: "archivos",
        nombre: "Conecta la Constitución",
        miniatura: miniaturaArchivos,
        destino: "archivos"
      },
      {
        id: "construye",
        nombre: "Construye la Constitución",
        miniatura: miniaturaConstruye,
        destino: "construye"      }
    ];

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Minijuegos</h1>
          <div style={styles.menuUnderline} />
        </div>

        {listaMinijuegos.map((j) => (
          <button
            key={j.id}
            onClick={() => setPantalla(j.destino)}
            style={styles.filaMinijuegoBtn}
          >
            {j.miniatura ? (
              <img
                src={j.miniatura}
                alt={j.nombre}
                style={styles.miniaturaMinijuego}
              />
            ) : (
              <span style={styles.miniaturaMinijuegoEmoji}>{j.emoji}</span>
            )}
            <span style={styles.filaMinijuegoTexto}>{j.nombre}</span>
            <span style={{ color: "#8a8578" }}>→</span>
          </button>
        ))}

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

// 🏁 DETALLE DE "CARRERA POR LA PLAZA"
if (pantalla === "muerte") {
  return (
    <SalvaTrabajadoraSocial
      preguntasBase={preguntasBase}
      setPantalla={setPantalla}
      volverMenu={volverMenu}
    />
  );
}
  // 📁 DETALLE DE "CONECTA LA CONSTITUCIÓN"
  if (pantalla === "archivos") {
    return <ConectaConstitucion setPantalla={setPantalla} volverMenu={volverMenu} />;
  }


// ☠️ SALVA A TU TRABAJADORA SOCIAL — EN CURSO
if (pantalla === "muerte-jugando" && muertePreguntas[muerteIndice]) {
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

// ☠️ DERROTA EN "SALVA A TU TRABAJADORA SOCIAL"
if (pantalla === "muerte-derrota") {
  return (
    <div style={styles.derrotaContainer}>
      <img
        src={muerteImgDerrota}
        alt="La burocracia gana"
        style={styles.derrotaImagenFondo}
      />

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

// 🎉 VICTORIA EN "SALVA A TU TRABAJADORA SOCIAL"
if (pantalla === "muerte-victoria") {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.muerteImagenCol}>
          <img
            src={muerteImgVictoria}
            alt="Has sobrevivido"
            style={styles.muerteImagen}
          />
        </div>

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

  // ⚙️ AJUSTES — perfil y código de sincronización
  if (pantalla === "ajustes") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>👤 Mi perfil</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>☁️ Tu código de progreso</p>

          {codigo ? (
            <>
              <p style={styles.configSubLabel}>
                Progreso vinculado al código: <b>{codigo}</b>
              </p>
              <p style={styles.configSubLabel}>
                Usa este mismo código en otro dispositivo para recuperar tu
                progreso ahí también.
              </p>

              <button
                onClick={() => sincronizarConNube()}
                disabled={sincronizando}
                style={styles.ctaButton}
              >
                {sincronizando ? "Sincronizando..." : "🔄 Sincronizar ahora"}
              </button>

              <button onClick={borrarCodigo} style={styles.linkVolver}>
                Dejar de usar este código en este dispositivo
              </button>
            </>
          ) : (
            <>
              <p style={styles.configSubLabel}>
                Ponte un código (el que quieras) para guardar tu progreso y
                poder recuperarlo desde cualquier otro dispositivo. Si no
                pones ninguno, tu progreso se queda solo en este dispositivo,
                como hasta ahora.
              </p>

              <input
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                placeholder="Ej: judit1234"
                style={styles.nombreInput}
              />

              <button
                onClick={guardarCodigo}
                disabled={sincronizando || !codigoInput.trim()}
                style={{
                  ...styles.ctaButton,
                  ...(sincronizando || !codigoInput.trim()
                    ? styles.ctaButtonDisabled
                    : {})
                }}
              >
                {sincronizando ? "Conectando..." : "Guardar código"}
              </button>
            </>
          )}

          {mensajeSync && (
            <p style={{ ...styles.configSubLabel, marginTop: 10 }}>
              {mensajeSync}
            </p>
          )}
        </div>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // 🟣 QUIZ (estudio general / por bloques / repasar errores)
  if (pantalla === "quiz" && pregunta) {
    return (
      <div style={styles.container}>
        <button onClick={volverMenu} style={styles.button}>
          ⬅ Menú
        </button>

        {tiempoRestante !== null && (
          <p style={{ fontWeight: 700, color: "#e29aa0" }}>
            ⏱ {formatearTiempo(tiempoRestante)}
          </p>
        )}

        <p>
          Pregunta {indice + 1} / {preguntas.length}
        </p>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "center" }}>
          <h3 style={{ margin: 0 }}>{pregunta.pregunta}</h3>
          <button
            onClick={() => toggleFavorito(pregunta.id)}
            title="Marcar como favorita"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1
            }}
          >
            {favoritos.includes(String(pregunta.id)) ? "⭐" : "☆"}
          </button>
        </div>

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

        {mostrar && (
          <>
            <p>{mensaje}</p>

            {(() => {
              const s = obtenerStats()[String(pregunta.id)];

              if (!s) return null;

              const acertoAhora = mensaje === "✅ Correcto";

              if (acertoAhora) {
                if (s.errores >= 3) {
                  return (
                    <p>
                      💪 Antes te costaba, pero hoy la has clavado.
                    </p>
                  );
                }
                return null;
              }

              if (s.errores >= 5) {
                return (
                  <p>
                    💀 Deja las cervezas y ponte a estudiar.
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

              return null;
            })()}

{conExplicacion && (
              <div style={styles.explicacionCaja}>
                <p style={{ margin: 0 }}>
                  <b>Explicación:</b>
                </p>
                {renderizarTextoConNegrita(pregunta.explicacion)}
              </div>
            )}

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

// ⏱️ tiempo medio por pregunta

function formatearTiempo(segundosTotales) {
  const m = Math.floor(segundosTotales / 60);
  const s = segundosTotales % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 📖 separa frases pegadas ("...guerra.La ley...") en líneas distintas para que se lea mejor,
// y convierte **texto** en negrita de verdad (ya que el CSV no guarda formato de Sheets)
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