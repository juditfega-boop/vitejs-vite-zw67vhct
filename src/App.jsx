import { useEffect, useRef, useState } from "react";
import { cargarPreguntas } from "./cargarPreguntas";
import portada from "./assets/portada.jpeg";
import video2Jugadoras from "./assets/carrera-video-2.mp4";
import video3Jugadoras from "./assets/carrera-video-3.mp4";
import video4Jugadoras from "./assets/carrera-video-4.mp4";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import muerteImg0 from "./assets/trabajadora-0.png";
import muerteImg1 from "./assets/trabajadora-1.png";
import muerteImg2 from "./assets/trabajadora-2.png";
import muerteImg3 from "./assets/trabajadora-3.png";
import muerteImgDerrota from "./assets/trabajadora-derrota.png";
import muerteImgVictoria from "./assets/trabajadora-victoria.png";
import { ARTICULOS_CONSTITUCION } from "./datosArticulosConstitucion";
import { FECHAS_CONSTITUCION } from "./datosFechasConstitucion";
import { ESTRUCTURA_CONSTITUCION } from "./construyeConstitucion";
import miniaturaArchivos from "./assets/archivos-miniatura.png";
import miniaturaConstruye from "./assets/construye-miniatura.png";
import construyeTecho from "./assets/construye-techo.png";
import construyePlantaBaja from "./assets/construye-plantabaja.png";
import construyeArchivero from "./assets/construye-archivero.png";
import miniaturaCarreraPlaza from "./assets/carrera-miniatura.jpg";

const CLAVE_STATS = "opo_stats_v1";
const CLAVE_RACHA = "opo_racha_v1";
const CLAVE_TIEMPOS = "opo_tiempos_v1";
const CLAVE_FAVORITOS = "opo_favoritos_v1";
const CLAVE_HISTORIAL_JUEGO = "opo_juego_historial_v1";
const CLAVE_CODIGO = "opo_codigo_perfil_v1";

// ⏱️ duración total del simulacro oficial (minutos). Ajusta este número si quieres otro tiempo.
const DURACION_SIMULACRO_MINUTOS = 100;

// 📌 Array de frases de bienvenida — añade aquí nuevas cuando quieras
const FRASES_BIENVENIDA = [
  "venimos de personas que con la poesía cambiaron el mundo",
  "me declaro aprendiz imperecedera",
  "el conocimiento también se construye en sociedad"
];

// 🎮 frases graciosas para el minijuego "Carrera por la Plaza"
const FRASES_MINIJUEGO = [
  "El comité técnico ha deliberado: alguien necesita repasar la Ley 😅",
  "Esta partida generaría un informe social muy interesante",
  "Nivel de coordinación de caso: mejorable",
  "Ander-Egg estaría tomando notas de esta sesión, y sugeriría que os pusieráis a estudiar",
  "Recordad: Debéis una cerveza a quién haya ganado",
  "La derivación de este grupo está clara: ¡Toca estudiar!"
];
// ☠️ frases de derrota para "Salva a tu trabajadora social"
const FRASES_DERROTA_MUERTE = [
  "Esta vez la burocracia ganó.",
  "El expediente te ha vencido... por ahora.",
  "Vuelve a intentarlo, la plaza no se rinde tan fácil.",
  "Ni Mary Richmond pudo con tanto papeleo de golpe."
];

// 🗝️ frases del Archivero (mascota ficticia) en "Construye la Constitución"
const FRASES_ARCHIVERO_FRIO = [
  "Frío, frío... ese expediente está en otro cajón.",
  "Nada que ver. Vuelve a mirar los números.",
  "Ahí no es. Sigue buscando."
];
const FRASES_ARCHIVERO_TEMPLADO = [
  "Templado... vas por buen camino.",
  "Cerca, muy cerca. Solo falta un ajuste.",
  "Casi lo tienes, revisa un número."
];
const FRASES_ARCHIVERO_CALIENTE = [
  "¡Caliente, caliente! Perfecto.",
  "Ahí está. Bien archivado.",
  "Exacto. Ese ya está en su sitio."
];

// 🎬 posiciones medidas (top/left en %) de cada carril en el segundo 5 del vídeo,
// ordenadas de 1ª a última posición según el vídeo correspondiente
const POSICIONES_VIDEO = {
  2: [
    { top: 15, left: 6 },
    { top: 32, left: 6 }
  ],
  3: [
    { top: 15, left: 6 },
    { top: 32, left: 6 },
    { top: 49, left: 6 }
  ],
  4: [
    { top: 15, left: 6 },
    { top: 32, left: 6 },
    { top: 49, left: 6 },
    { top: 66, left: 6 }
  ]
};

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

  // 🎮 estado del minijuego "Carrera por la Plaza" (independiente de las estadísticas personales)
  const [juegoNumJugadores, setJuegoNumJugadores] = useState(2);
  const [juegoNombres, setJuegoNombres] = useState(["Jugadora 1", "Jugadora 2"]);
  const [juegoTipo, setJuegoTipo] = useState("general"); // "general" | "bloques"
  const [juegoBloquesSeleccionados, setJuegoBloquesSeleccionados] = useState([]);
  const [juegoNumPreguntas, setJuegoNumPreguntas] = useState(10);
  const [juegoCronometroActivo, setJuegoCronometroActivo] = useState(false);

  const [preguntasJuego, setPreguntasJuego] = useState([]);
  const [puntuacionesJuego, setPuntuacionesJuego] = useState([]);
  const [turnoActual, setTurnoActual] = useState(0);
  const [respuestaSeleccionadaJuego, setRespuestaSeleccionadaJuego] = useState(null);
  const [tiempoRestanteJuego, setTiempoRestanteJuego] = useState(null);
  const [piezasConfeti, setPiezasConfeti] = useState([]);
  const [fraseJuego, setFraseJuego] = useState("");
  const [inicioTurno, setInicioTurno] = useState(null);
  const [jugadoraExpandida, setJugadoraExpandida] = useState(null);
  const [mostrarNombresVideo, setMostrarNombresVideo] = useState(false);
  const [refrescoHistorial, setRefrescoHistorial] = useState(0);

  // ☠️ estado del minijuego "Salva a tu trabajadora social" (una sola jugadora, una sola vida)
  const [muerteTipo, setMuerteTipo] = useState("general"); // "general" | "bloques"
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
      prev.includes(nombre)
        ? prev.filter((b) => b !== nombre)
        : [...prev, nombre]
    );
  }

  function imagenMuerteSubita(aciertos) {
    const etapa = Math.min(3, Math.floor(aciertos / 5));
    return [muerteImg0, muerteImg1, muerteImg2, muerteImg3][etapa];
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
    setPantalla("muerte-jugando");
  }

  function perderMuerte() {
    setFraseDerrota(
      FRASES_DERROTA_MUERTE[Math.floor(Math.random() * FRASES_DERROTA_MUERTE.length)]
    );
    setPantalla("muerte-derrota");
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
      setPantalla("muerte-victoria");
    } else {
      setMuerteIndice(siguienteIndice);
      setMuerteTiempoRestante(muerteCronometroActivo ? 60 : null);
    }
  }

// 📁 estado del minijuego de emparejar "Conecta la Constitución"
const EXPEDIENTES_CONECTA = [
  { id: "articulos", nombre: "Artículos y contenido", emoji: "🛡️", datos: ARTICULOS_CONSTITUCION },
  { id: "fechas", nombre: "Fechas importantes", emoji: "🗓️", datos: FECHAS_CONSTITUCION }
];

const [archivosDatosActivos, setArchivosDatosActivos] = useState([]);
const [archivosPareja, setArchivosPareja] = useState([]);
  const [archivosArticulos, setArchivosArticulos] = useState([]);
  const [archivosDescripciones, setArchivosDescripciones] = useState([]);
  const [archivosSelArticulo, setArchivosSelArticulo] = useState(null);
  const [archivosSelDescripcion, setArchivosSelDescripcion] = useState(null);
  const [archivosVerde, setArchivosVerde] = useState([]);
  const [archivosDesvaneciendo, setArchivosDesvaneciendo] = useState([]);
  const [archivosResueltos, setArchivosResueltos] = useState([]);
  const [archivosError, setArchivosError] = useState(null);
  const [archivosMostrarResumen, setArchivosMostrarResumen] = useState(false);

  function comenzarJuegoArchivos(datosExpediente) {
    const numParejas = Math.min(8, datosExpediente.length);
    const seleccionadas = mezclar(datosExpediente).slice(0, numParejas);

    setArchivosDatosActivos(datosExpediente);
    setArchivosPareja(seleccionadas);
    setArchivosArticulos(
      mezclar(seleccionadas.map((a) => ({
        id: a.id,
        texto: a.etiqueta || `Artículo ${a.articulo}`
      })))
    );
    setArchivosDescripciones(
      mezclar(seleccionadas.map((a) => ({ id: a.id, texto: a.descripcion })))
    );
    setArchivosSelArticulo(null);
    setArchivosSelDescripcion(null);
    setArchivosVerde([]);
    setArchivosDesvaneciendo([]);
    setArchivosResueltos([]);
    setArchivosError(null);
    setArchivosMostrarResumen(false);
    setPantalla("archivos-jugando");
  }

  function comprobarParejaArchivos(idArticulo, idDescripcion) {
    if (idArticulo === idDescripcion) {
      setArchivosVerde((v) => [...v, idArticulo]);

      setTimeout(() => {
        setArchivosDesvaneciendo((d) => [...d, idArticulo]);
      }, 500);

      setTimeout(() => {
        setArchivosResueltos((r) => [...r, idArticulo]);
        setArchivosVerde((v) => v.filter((x) => x !== idArticulo));
        setArchivosDesvaneciendo((d) => d.filter((x) => x !== idArticulo));
        setArchivosSelArticulo(null);
        setArchivosSelDescripcion(null);
      }, 800);
    } else {
      setArchivosError({ articulo: idArticulo, descripcion: idDescripcion });

      setTimeout(() => {
        setArchivosError(null);
        setArchivosSelArticulo(null);
        setArchivosSelDescripcion(null);
      }, 450);
    }
  }

  function seleccionarArticuloArchivos(id) {
    if (archivosResueltos.includes(id) || archivosError) return;
    setArchivosSelArticulo(id);
    if (archivosSelDescripcion !== null) {
      comprobarParejaArchivos(id, archivosSelDescripcion);
    }
  }

  function seleccionarDescripcionArchivos(id) {
    if (archivosResueltos.includes(id) || archivosError) return;
    setArchivosSelDescripcion(id);
    if (archivosSelArticulo !== null) {
      comprobarParejaArchivos(archivosSelArticulo, id);
    }
  }

  function agruparArchivosPorCapitulo(lista) {
    const grupos = {};

    lista.forEach((item) => {
      const clave = item.capituloNumero;
      if (!grupos[clave]) {
        grupos[clave] = {
          numero: item.capituloNumero,
          nombre: item.capituloNombre,
          articulos: []
        };
      }
      grupos[clave].articulos.push(item);
    });

    return Object.values(grupos)
    .sort((a, b) => a.numero.localeCompare(b.numero))
    .map((g) => ({
      ...g,
      articulos: [...g.articulos].sort(
        (a, b) => (a.orden ?? a.articulo ?? 0) - (b.orden ?? b.articulo ?? 0)
      )
    }));
  }

// 🏛️ estado del minijuego "Construye la Constitución"
const [construyeAmbito, setConstruyeAmbito] = useState([]);
  const [construyeRespuestas, setConstruyeRespuestas] = useState({});
  const [construyeResultados, setConstruyeResultados] = useState({});
  const [construyeMensajes, setConstruyeMensajes] = useState({});
  const [construyeCompleto, setConstruyeCompleto] = useState(false);

  function iniciarConstruye(ambito) {
    setConstruyeAmbito(ambito);
    setConstruyeRespuestas({});
    setConstruyeResultados({});
    setConstruyeMensajes({});
    setConstruyeCompleto(false);
    setPantalla("construye-jugando");
  }

function actualizarRespuestaConstruye(id, campo, valor) {
  setConstruyeRespuestas((prev) => ({
    ...prev,
    [id]: { ...prev[id], [campo]: valor }
  }));
}

function comprobarConstruye() {
  const resultados = {};
  const mensajes = {};
  let todoCorrecto = true;
  construyeAmbito.forEach((item) => {
    const respuesta = construyeRespuestas[item.id] || {};
    const inicioOk = Number(respuesta.inicio) === item.inicio;
    const finOk = Number(respuesta.fin) === item.fin;
    let estado;
    if (inicioOk && finOk) {
      estado = "correcto";
    } else if (inicioOk || finOk) {
      estado = "parcial";
      todoCorrecto = false;
    } else {
      estado = "incorrecto";
      todoCorrecto = false;
    }
    resultados[item.id] = estado;
    const listaFrases =
      estado === "correcto"
        ? FRASES_ARCHIVERO_CALIENTE
        : estado === "parcial"
        ? FRASES_ARCHIVERO_TEMPLADO
        : FRASES_ARCHIVERO_FRIO;
    mensajes[item.id] = listaFrases[Math.floor(Math.random() * listaFrases.length)];
  });
  setConstruyeResultados(resultados);
  setConstruyeMensajes(mensajes);
  setConstruyeCompleto(todoCorrecto);
}

  function eliminarPartidaHistorial(index) {
    const historial = obtenerHistorialJuego();
    historial.splice(index, 1);
    localStorage.setItem(CLAVE_HISTORIAL_JUEGO, JSON.stringify(historial));
    setRefrescoHistorial((v) => v + 1);
  }

  function vaciarHistorialJuego() {
    localStorage.setItem(CLAVE_HISTORIAL_JUEGO, JSON.stringify([]));
    setRefrescoHistorial((v) => v + 1);
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

  function cambiarNumJugadoresJuego(n) {
    setJuegoNumJugadores(n);
    setJuegoNombres((prev) => {
      const nuevo = [...prev];
      while (nuevo.length < n) nuevo.push(`Jugadora ${nuevo.length + 1}`);
      return nuevo.slice(0, n);
    });
  }

  function actualizarNombreJugador(i, valor) {
    setJuegoNombres((prev) => {
      const copia = [...prev];
      copia[i] = valor;
      return copia;
    });
  }

  function toggleBloqueJuego(nombre) {
    setJuegoBloquesSeleccionados((prev) =>
      prev.includes(nombre)
        ? prev.filter((b) => b !== nombre)
        : [...prev, nombre]
    );
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

  // 🎮 turno actual del minijuego (rota entre jugadores)
  const totalTurnosJuego = juegoNumJugadores * juegoNumPreguntas;
  const jugadorActualIndice = turnoActual % juegoNumJugadores;
  const rondaActualJuego = Math.floor(turnoActual / juegoNumJugadores);
  const preguntaJuego =
    preguntasJuego[jugadorActualIndice] &&
    preguntasJuego[jugadorActualIndice][rondaActualJuego];

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

  // ⏱️ cuenta atrás del minijuego (1 min por turno, si el cronómetro está activo)
  useEffect(() => {
    if (
      pantalla !== "juego-jugando" ||
      !juegoCronometroActivo ||
      tiempoRestanteJuego === null
    )
      return;

    if (tiempoRestanteJuego <= 0) {
      if (respuestaSeleccionadaJuego === null) {
        const tiempoUsado = inicioTurno ? Date.now() - inicioTurno : 60000;

        setPuntuacionesJuego((prev) => {
          const copia = [...prev];
          if (copia[jugadorActualIndice]) {
            const actual = copia[jugadorActualIndice];
            copia[jugadorActualIndice] = {
              ...actual,
              errores: actual.errores + 1,
              tiempoTotal: (actual.tiempoTotal || 0) + tiempoUsado,
              fallos: [
                ...actual.fallos,
                {
                  pregunta: preguntaJuego ? preguntaJuego.pregunta : "",
                  respuestaDada: "(sin responder a tiempo)",
                  correcta: preguntaJuego
                    ? preguntaJuego.respuestas[preguntaJuego.correcta]
                    : ""
                }
              ]
            };
          }
          return copia;
        });
      }
      avanzarTurno();
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestanteJuego((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [pantalla, tiempoRestanteJuego, juegoCronometroActivo, turnoActual]);

  // ⏱️ cuenta atrás de Salva a tu trabajadora social (si el cronómetro está activo)
  useEffect(() => {
    if (
      pantalla !== "muerte-jugando" ||
      !muerteCronometroActivo ||
      muerteTiempoRestante === null
    )
      return;

    if (muerteTiempoRestante <= 0) {
      perderMuerte();
      return;
    }

    const id = setTimeout(() => {
      setMuerteTiempoRestante((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [pantalla, muerteTiempoRestante, muerteCronometroActivo]);

  // 📁 cuando las 8 parejas están resueltas, pasa a la pantalla de resultado
  useEffect(() => {
    if (
      pantalla === "archivos-jugando" &&
      archivosPareja.length > 0 &&
      archivosResueltos.length === archivosPareja.length
    ) {
      const id = setTimeout(() => setPantalla("archivos-resultado"), 400);
      return () => clearTimeout(id);
    }
  }, [pantalla, archivosResueltos, archivosPareja]);

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

  // 🎮 MINIJUEGO "CARRERA POR LA PLAZA" — no toca estadísticas ni memoria personal

  function comenzarPartida() {
    let listaFuente = preguntasBase;

    if (juegoTipo === "bloques") {
      listaFuente = preguntasBase.filter((p) =>
        juegoBloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const totalNecesarias = juegoNumJugadores * juegoNumPreguntas;
    const pool = mezclar(listaFuente)
      .slice(0, totalNecesarias)
      .map(prepararPregunta);

    const porJugador = [];
    for (let j = 0; j < juegoNumJugadores; j++) {
      porJugador.push(
        pool.slice(j * juegoNumPreguntas, (j + 1) * juegoNumPreguntas)
      );
    }

    setPreguntasJuego(porJugador);
    setPuntuacionesJuego(
      juegoNombres.slice(0, juegoNumJugadores).map((nombre) => ({
        nombre: nombre.trim() || "Jugadora",
        aciertos: 0,
        errores: 0,
        tiempoTotal: 0,
        fallos: []
      }))
    );
    setTurnoActual(0);
    setRespuestaSeleccionadaJuego(null);
    setJugadoraExpandida(null);
    setMostrarNombresVideo(false);
    setPantalla("juego-transicion");
  }

  function comenzarTurno() {
    setRespuestaSeleccionadaJuego(null);
    setTiempoRestanteJuego(juegoCronometroActivo ? 60 : null);
    setInicioTurno(Date.now());
    setPantalla("juego-jugando");
  }

  function responderJuego(i) {
    if (respuestaSeleccionadaJuego !== null || !preguntaJuego) return;

    setRespuestaSeleccionadaJuego(i);

    const esCorrecta = i === preguntaJuego.correcta;
    const tiempoUsado = inicioTurno ? Date.now() - inicioTurno : 0;

    setPuntuacionesJuego((prev) => {
      const copia = [...prev];
      const actual = copia[jugadorActualIndice];
      copia[jugadorActualIndice] = {
        ...actual,
        aciertos: actual.aciertos + (esCorrecta ? 1 : 0),
        errores: actual.errores + (esCorrecta ? 0 : 1),
        tiempoTotal: (actual.tiempoTotal || 0) + tiempoUsado,
        fallos: esCorrecta
          ? actual.fallos
          : [
              ...actual.fallos,
              {
                pregunta: preguntaJuego.pregunta,
                respuestaDada: preguntaJuego.respuestas[i],
                correcta: preguntaJuego.respuestas[preguntaJuego.correcta]
              }
            ]
      };
      return copia;
    });
  }

  function avanzarTurno() {
    const siguienteTurno = turnoActual + 1;

    if (siguienteTurno >= totalTurnosJuego) {
      finalizarJuego();
    } else {
      setTurnoActual(siguienteTurno);
      setRespuestaSeleccionadaJuego(null);
      setPantalla("juego-transicion");
    }
  }

  function generarConfeti() {
    const colores = ["#f2b366", "#e29aa0", "#d9cdf0", "#d7dcc0", "#f3cdd2"];

    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      izquierda: Math.random() * 100,
      retraso: Math.random() * 0.6,
      duracion: 2.2 + Math.random() * 1.6,
      color: colores[i % colores.length],
      giro: Math.round(Math.random() * 360)
    }));
  }

  function finalizarJuego() {
    setTiempoRestanteJuego(null);
    setPiezasConfeti(generarConfeti());
    setFraseJuego(
      FRASES_MINIJUEGO[Math.floor(Math.random() * FRASES_MINIJUEGO.length)]
    );
    guardarPartidaHistorial(puntuacionesJuego);
    setMostrarNombresVideo(false);
    setPantalla("juego-resultado");
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
        destino: "juego-detalle-carrera"
      },
      {
        id: "muerte",
        nombre: "Salva a tu trabajadora social",
        miniatura: muerteImg0,
        destino: "muerte-detalle"
      },
      {
        id: "archivos",
        nombre: "Conecta la Constitución",
        miniatura: miniaturaArchivos,
        destino: "archivos-detalle"
      },
      {
        id: "construye",
        nombre: "Construye la Constitución",
        miniatura: miniaturaConstruye,
        destino: "construye-detalle"
      }
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
  if (pantalla === "juego-detalle-carrera") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>🏁 Carrera por la Plaza</h1>
          <div style={styles.menuUnderline} />
        </div>

        <p style={styles.configSubLabel}>
          De 2 a 4 personas, un solo dispositivo. Cada jugadora responde su
          propia tanda de preguntas por turnos, sin ver el resultado hasta
          el final. Gana quien más aciertos consiga.
        </p>

        <button
          onClick={() => setPantalla("juego-config")}
          style={styles.ctaButton}
        >
          Jugar
        </button>

        <button
          onClick={() => setPantalla("juego-historial")}
          style={styles.linkVolver}
        >
          🕓 Ver historial de partidas
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // ☠️ DETALLE DE "SALVA A TU TRABAJADORA SOCIAL"
  if (pantalla === "muerte-detalle") {
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

        <button
          onClick={() => setPantalla("muerte-config")}
          style={styles.ctaButton}
        >
          Jugar
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 📁 DETALLE DE "CONECTA LA CONSTITUCIÓN"
  if (pantalla === "archivos-detalle") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📁 Conecta la Constitución</h1>
          <div style={styles.menuUnderline} />
        </div>

        <p style={styles.configSubLabel}>
          Alguien ha mezclado los archivos de la Constitución. Tu misión es
          volver a organizarlos: relaciona cada artículo con su contenido.
          Cada partida elige 8 parejas al azar.
        </p>

        <button onClick={() => setPantalla("archivos-expedientes")} style={styles.ctaButton}>
          Jugar
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 📁 ELEGIR EXPEDIENTE PARA "CONECTA LA CONSTITUCIÓN"
  if (pantalla === "archivos-expedientes") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📁 Elige un expediente</h1>
          <div style={styles.menuUnderline} />
        </div>

        {EXPEDIENTES_CONECTA.map((exp) => (
          <button
            key={exp.id}
            onClick={() => comenzarJuegoArchivos(exp.datos)}
            style={styles.filaMinijuegoBtn}
          >
            <span style={styles.miniaturaMinijuegoEmoji}>{exp.emoji}</span>
            <span style={styles.filaMinijuegoTexto}>{exp.nombre}</span>
            <span style={{ color: "#8a8578" }}>→</span>
          </button>
        ))}

        <button onClick={() => setPantalla("archivos-detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

// 🏛️ DETALLE DE "CONSTRUYE LA CONSTITUCIÓN"
if (pantalla === "construye-detalle") {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>🏛️ Construye la Constitución</h1>
        <div style={styles.menuUnderline} />
      </div>

      <p style={styles.configSubLabel}>
          La Constitución se ha desmontado. Tu misión es volver a
          construirla, planta a planta: completa el artículo inicial y
          final de cada título, capítulo y sección.
        </p>

        <button
          onClick={() => setPantalla("construye-config")}
          style={styles.ctaButton}
        >
          Construir
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

// 🏛️ ELEGIR QUÉ CONSTRUIR
if (pantalla === "construye-config") {
  const titulos = ESTRUCTURA_CONSTITUCION.filter((i) => i.tipo === "Título");

  return (
    <div style={styles.menuContainer}>
      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>¿Qué quieres construir?</h1>
        <div style={styles.menuUnderline} />
      </div>

      <button
        onClick={() => iniciarConstruye(ESTRUCTURA_CONSTITUCION)}
        style={{ ...styles.menuButton, ...styles.btnPeach }}
        className="menu-btn"
      >
        🏛️ La Constitución completa
      </button>

        {titulos.map((t) => (
          <button
            key={t.id}
            className="menu-btn"
            onClick={() =>
              iniciarConstruye(
                ESTRUCTURA_CONSTITUCION.filter(
                  (i) => i.inicio >= t.inicio && i.fin <= t.fin
                )
              )
            }
            style={{ ...styles.menuButton, ...styles.btnMint }}
          >
            {t.nombre} — {t.titulo}
          </button>
        ))}

        <button onClick={() => setPantalla("construye-detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

// 🏛️ "CONSTRUYE LA CONSTITUCIÓN" — EN CURSO (dentro del propio edificio)
if (pantalla === "construye-jugando") {
  const paletaFloors = ["#c9e4d0", "#f6d7ae", "#f3cdd2", "#cbe0ea"];

  return (
    <div style={styles.menuContainer}>
      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>🏛️ Construyendo...</h1>
        <div style={styles.menuUnderline} />
      </div>

      {construyeCompleto && (
        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <p style={{ fontSize: 20, margin: 0 }}>🏛️ ¡Constitución reconstruida!</p>
          <p style={styles.configSubLabel}>
            Has completado correctamente toda esta estructura.
          </p>
        </div>
      )}

      <div style={styles.edificioMarco}>
        <img src={construyeTecho} alt="" style={styles.edificioTechoImg} />

        <div style={styles.edificioPlantasWrap}>
          {construyeAmbito.map((item, i) => {
            const resultado = construyeResultados[item.id];
            const mensaje = construyeMensajes[item.id];
            const respuesta = construyeRespuestas[item.id] || {};
            const colorPlanta = paletaFloors[i % paletaFloors.length];

            return (
              <div
                key={item.id}
                style={{ ...styles.edificioPlanta, background: colorPlanta }}
              >
                <p style={styles.edificioPlantaTitulo}>
                  {item.nombre} {resultado === "correcto" ? "✅" : ""}
                </p>
                <p style={styles.edificioPlantaSubtitulo}>{item.titulo}</p>

                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.configSubLabel}>Art. inicial</label>
                    <input
                      type="number"
                      value={respuesta.inicio || ""}
                      onChange={(e) =>
                        actualizarRespuestaConstruye(item.id, "inicio", e.target.value)
                      }
                      style={styles.numeroInput}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.configSubLabel}>Art. final</label>
                    <input
                      type="number"
                      value={respuesta.fin || ""}
                      onChange={(e) =>
                        actualizarRespuestaConstruye(item.id, "fin", e.target.value)
                      }
                      style={styles.numeroInput}
                    />
                  </div>
                </div>

                {resultado && resultado !== "correcto" && (
                  <div style={styles.archiveroGlobo}>
                    🗝️ {mensaje}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <img src={construyePlantaBaja} alt="" style={styles.edificioPlantaBajaImg} />
        </div>

        <div style={styles.archiveroPresentacion}>
          <img src={construyeArchivero} alt="Ezequiel, el Archivero" style={styles.archiveroFoto} />
          <div style={styles.archiveroGloboPresentacion}>
            Soy Ezequiel, el Archivero. Si necesitas ayuda con alguna puerta, avísame.
          </div>
        </div>

        <button onClick={comprobarConstruye} style={styles.ctaButton}>
          Comprobar
        </button>

      <button
        onClick={() => setPantalla("construye-config")}
        style={styles.linkVolver}
      >
        ⬅ Elegir otra vez qué construir
      </button>

      <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
        ⬅ Volver a minijuegos
      </button>
    </div>
  );
}

  // 📁 "CONECTA LA CONSTITUCIÓN" — EN CURSO
  if (pantalla === "archivos-jugando") {
    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>
            📁 Archivados: {archivosResueltos.length} / {archivosPareja.length}
          </span>
        </div>

        <div style={styles.archivosColumnas}>
          <div style={styles.archivosColumna}>
            {archivosArticulos.map((item) => {
              if (archivosResueltos.includes(item.id)) return null;

              const seleccionado = archivosSelArticulo === item.id;
              const enVerde = archivosVerde.includes(item.id);
              const enError =
                archivosError && archivosError.articulo === item.id;
              const desvaneciendo = archivosDesvaneciendo.includes(item.id);

              return (
                <button
                  key={item.id}
                  className={enError ? "archivos-shake" : ""}
                  onClick={() => seleccionarArticuloArchivos(item.id)}
                  style={{
                    ...styles.archivosTarjeta,
                    ...(seleccionado ? styles.archivosTarjetaSeleccionada : {}),
                    ...(enVerde ? styles.archivosTarjetaCorrecta : {}),
                    ...(enError ? styles.archivosTarjetaError : {}),
                    ...(desvaneciendo ? { opacity: 0, transform: "scale(0.9)" } : {})
                  }}
                >
                  {item.texto}
                </button>
              );
            })}
          </div>

          <div style={styles.archivosColumna}>
            {archivosDescripciones.map((item) => {
              if (archivosResueltos.includes(item.id)) return null;

              const seleccionado = archivosSelDescripcion === item.id;
              const enVerde = archivosVerde.includes(item.id);
              const enError =
                archivosError && archivosError.descripcion === item.id;
              const desvaneciendo = archivosDesvaneciendo.includes(item.id);

              return (
                <button
                  key={item.id}
                  className={enError ? "archivos-shake" : ""}
                  onClick={() => seleccionarDescripcionArchivos(item.id)}
                  style={{
                    ...styles.archivosTarjeta,
                    ...styles.archivosTarjetaDescripcion,
                    ...(seleccionado ? styles.archivosTarjetaSeleccionada : {}),
                    ...(enVerde ? styles.archivosTarjetaCorrecta : {}),
                    ...(enError ? styles.archivosTarjetaError : {}),
                    ...(desvaneciendo ? { opacity: 0, transform: "scale(0.9)" } : {})
                  }}
                >
                  {item.texto}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 📁 RESULTADO DE "CONECTA LA CONSTITUCIÓN"
  if (pantalla === "archivos-resultado") {
    const grupos = agruparArchivosPorCapitulo(archivosPareja);

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📁 Archivos organizados correctamente</h1>
          <div style={styles.menuUnderline} />
        </div>

        <button onClick={() => comenzarJuegoArchivos(archivosDatosActivos)} style={styles.ctaButton}>
          Jugar otra vez
        </button>

        <button
          onClick={() => setArchivosMostrarResumen((v) => !v)}
          style={styles.linkVolver}
        >
          {archivosMostrarResumen ? "▲ Ocultar resumen" : "▼ Ver resumen"}
        </button>

        {archivosMostrarResumen && (
          <div style={{ marginTop: 10 }}>
            {grupos.map((g) => (
              <div key={g.numero} style={styles.configCard}>
                <p style={styles.configCardTitle}>
                  Capítulo {g.numero} — {g.nombre}
                </p>
                {g.articulos.map((a) => (
                  <p key={a.id} style={{ ...styles.configSubLabel, marginBottom: 6 }}>
                    <b>{a.etiqueta || `Artículo ${a.articulo}`}:</b> {a.descripcion}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver a minijuegos
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // ⚙️ CONFIGURACIÓN DE "CARRERA POR LA PLAZA"
  if (pantalla === "juego-config") {
    const bloquesDisponiblesJuego = Object.keys(
      agruparPorBloques(preguntasBase)
    );

    let listaFuenteJuego = preguntasBase;
    if (juegoTipo === "bloques") {
      listaFuenteJuego = preguntasBase.filter((p) =>
        juegoBloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const necesariasJuego = juegoNumJugadores * juegoNumPreguntas;
    const disponiblesJuego = listaFuenteJuego.length;
    const hayPreguntasSuficientes = disponiblesJuego >= necesariasJuego;

    const puedeEmpezarJuego =
      (juegoTipo === "general" || juegoBloquesSeleccionados.length > 0) &&
      juegoNombres
        .slice(0, juegoNumJugadores)
        .every((n) => n.trim().length > 0) &&
      hayPreguntasSuficientes;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Carrera por la Plaza</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Número de jugadoras</p>
          <div style={styles.pillGroup}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => cambiarNumJugadoresJuego(n)}
                style={{
                  ...styles.pillBtn,
                  ...(juegoNumJugadores === n ? styles.pillBtnActiva : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Nombres</p>
          {juegoNombres.slice(0, juegoNumJugadores).map((nombre, i) => (
            <input
              key={i}
              type="text"
              value={nombre}
              onChange={(e) => actualizarNombreJugador(i, e.target.value)}
              placeholder={`Jugadora ${i + 1}`}
              style={styles.nombreInput}
            />
          ))}
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Preguntas</p>
          <div style={styles.pillGroup}>
            <button
              className="pill"
              onClick={() => setJuegoTipo("general")}
              style={{
                ...styles.pillBtn,
                ...(juegoTipo === "general" ? styles.pillBtnActiva : {})
              }}
            >
              General
            </button>
            <button
              className="pill"
              onClick={() => setJuegoTipo("bloques")}
              style={{
                ...styles.pillBtn,
                ...(juegoTipo === "bloques" ? styles.pillBtnActiva : {})
              }}
            >
              Por bloques
            </button>
          </div>

          {juegoTipo === "bloques" && (
            <div style={styles.bloquesGrid}>
              {bloquesDisponiblesJuego.map((b) => (
                <button
                  key={b}
                  className="bloque-chip"
                  onClick={() => toggleBloqueJuego(b)}
                  style={{
                    ...styles.bloqueChip,
                    ...(juegoBloquesSeleccionados.includes(b)
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
          <p style={styles.configCardTitle}>Preguntas por jugadora</p>
          <div style={styles.pillGroup}>
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => setJuegoNumPreguntas(n)}
                style={{
                  ...styles.pillBtn,
                  ...(juegoNumPreguntas === n ? styles.pillBtnActiva : {})
                }}
              >
                {n}
              </button>
            ))}
          </div>
          {!hayPreguntasSuficientes && (
            <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 8 }}>
              No hay preguntas suficientes para esta configuración
              ({disponiblesJuego} disponibles, se necesitan {necesariasJuego}).
              Baja el número de preguntas o elige más bloques.
            </p>
          )}
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Activar cronómetro (1 min / pregunta)</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={juegoCronometroActivo}
                onChange={() => setJuegoCronometroActivo((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button
          onClick={comenzarPartida}
          disabled={!puedeEmpezarJuego}
          style={{
            ...styles.ctaButton,
            ...(puedeEmpezarJuego ? {} : styles.ctaButtonDisabled)
          }}
        >
Empezar partida
        </button>

        <button onClick={() => setPantalla("juego-detalle-carrera")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // ⚙️ CONFIGURACIÓN DE "SALVA A TU TRABAJADORA SOCIAL"
  if (pantalla === "muerte-config") {
    const bloquesDisponiblesMuerte = Object.keys(
      agruparPorBloques(preguntasBase)
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
            <div style={styles.bloquesGrid}>
              {bloquesDisponiblesMuerte.map((b) => (
                <button
                  key={b}
                  className="bloque-chip"
                  onClick={() => toggleBloqueMuerte(b)}
                  style={{
                    ...styles.bloqueChip,
                    ...(muerteBloquesSeleccionados.includes(b)
                      ? styles.bloqueChipActiva
                      : {})
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
              ({listaFuenteMuerte.length} disponibles). Elige más bloques o
              cambia a general.
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

        <button onClick={() => setPantalla("muerte-detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
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

  // 🔄 PANTALLA DE TRANSICIÓN ENTRE JUGADORAS
  if (pantalla === "juego-transicion") {
    const nombreActual =
      puntuacionesJuego[jugadorActualIndice]?.nombre || "Jugadora";

    return (
      <div style={styles.placeholderContainer}>
        <div style={styles.placeholderCard}>
          <div style={styles.placeholderEmoji}>📱</div>
          <h2>Ahora juega {nombreActual}</h2>
          <p style={styles.configSubLabel}>
            Pasa el dispositivo a {nombreActual} y pulsa comenzar cuando
            esté listo/a.
          </p>
          <p style={{ ...styles.configSubLabel, marginTop: 8 }}>
            Pregunta {rondaActualJuego + 1} / {juegoNumPreguntas}
          </p>
          <button onClick={comenzarTurno} style={styles.ctaButton}>
            Comenzar
          </button>
        </div>
      </div>
    );
  }

  // 🎮 TURNO EN CURSO
  if (pantalla === "juego-jugando" && preguntaJuego) {
    const nombreActual =
      puntuacionesJuego[jugadorActualIndice]?.nombre || "Jugadora";

    return (
      <div style={styles.menuContainer}>
        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>👤 {nombreActual}</span>
          {juegoCronometroActivo && (
            <span style={styles.simTimer}>
              ⏱ {formatearTiempo(tiempoRestanteJuego || 0)}
            </span>
          )}
        </div>

        <p style={styles.configSubLabel}>
          Pregunta {rondaActualJuego + 1} / {juegoNumPreguntas}
        </p>

        <h3>{preguntaJuego.pregunta}</h3>

        {preguntaJuego.respuestas.map((r, i) => (
          <button
            key={i}
            onClick={() => responderJuego(i)}
            disabled={respuestaSeleccionadaJuego !== null}
            style={{
              ...styles.simRespuestaBtn,
              ...(respuestaSeleccionadaJuego === i
                ? styles.simRespuestaSeleccionada
                : {})
            }}
          >
            {r}
          </button>
        ))}

        {respuestaSeleccionadaJuego !== null && (
          <button onClick={avanzarTurno} style={styles.ctaButton}>
            Pasar al siguiente jugador
          </button>
        )}
      </div>
    );
  }

  // 🏆🎬 VÍDEO + RESULTADO DE "CARRERA POR LA PLAZA" (fusionados)
  if (pantalla === "juego-resultado") {
    const videoSrc =
      juegoNumJugadores === 2
        ? video2Jugadoras
        : juegoNumJugadores === 3
        ? video3Jugadoras
        : video4Jugadoras;

    const ranking = [...puntuacionesJuego].sort((a, b) => {
      if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
      return (a.tiempoTotal || 0) - (b.tiempoTotal || 0);
    });

    const maxAciertos = ranking.length > 0 ? ranking[0].aciertos : 0;
    const minTiempoGanadoras =
      ranking.length > 0
        ? Math.min(
            ...ranking
              .filter((j) => j.aciertos === maxAciertos)
              .map((j) => j.tiempoTotal || 0)
          )
        : 0;
    const ganadoras = ranking.filter(
      (j) => j.aciertos === maxAciertos && (j.tiempoTotal || 0) === minTiempoGanadoras
    );
    const hayEmpate = ganadoras.length > 1;

    const posiciones = POSICIONES_VIDEO[juegoNumJugadores] || [];

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        {piezasConfeti.map((p) => (
          <span
            key={p.id}
            className="confeti-pieza"
            style={{
              left: `${p.izquierda}%`,
              background: p.color,
              animationDelay: `${p.retraso}s`,
              animationDuration: `${p.duracion}s`,
              transform: `rotate(${p.giro}deg)`
            }}
          />
        ))}

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>🏆 Clasificación</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.videoResultadoWrap}>
        <video
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onTimeUpdate={(e) => {
              const v = e.target;
              if (v.currentTime >= 5 && !mostrarNombresVideo) {
                setMostrarNombresVideo(true);
              }
              if (v.duration && v.currentTime >= v.duration - 2) {
                v.pause();
              }
            }}
            style={styles.videoElementInline}
          />

          {mostrarNombresVideo &&
            ranking.map((j, i) =>
              posiciones[i] ? (
                <span
                  key={j.nombre + i}
                  style={{
                    ...styles.etiquetaNombreVideo,
                    top: `${posiciones[i].top}%`,
                    left: `${posiciones[i].left}%`
                  }}
                >
                  {j.nombre}
                </span>
              ) : null
            )}
        </div>

        <p style={{ textAlign: "center", fontWeight: 700, color: "#4a463f" }}>
          {hayEmpate
            ? `¡Empate entre ${ganadoras.map((g) => g.nombre).join(" y ")}!`
            : `🥇 Gana ${ganadoras[0]?.nombre}`}
        </p>

        <div style={styles.resultCard}>
          {ranking.map((j, i) => (
            <div key={j.nombre + i}>
              <button
                onClick={() =>
                  setJugadoraExpandida(jugadoraExpandida === i ? null : i)
                }
                style={styles.filaJugadoraBtn}
              >
                <span>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🥉"} {j.nombre}
                </span>
                <b>
                  {j.aciertos} ✅ / {j.errores} ❌{" "}
                  {jugadoraExpandida === i ? "▲" : "▼"}
                </b>
              </button>

              {jugadoraExpandida === i && (
                <div style={styles.fallosWrap}>
                  {j.fallos.length === 0 ? (
                    <p style={styles.configSubLabel}>Sin fallos. Perfecto 🎯</p>
                  ) : (
                    j.fallos.map((f, k) => (
                      <div key={k} style={styles.falloItem}>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>
                          {f.pregunta}
                        </p>
                        <p style={{ color: "#c96a6a", margin: 0 }}>
                          Respondió: {f.respuestaDada}
                        </p>
                        <p style={{ color: "#6a9a6a", margin: 0 }}>
                          Correcta: {f.correcta}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {fraseJuego && (
          <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 14 }}>
            {fraseJuego}
          </p>
        )}

        <button onClick={comenzarPartida} style={styles.ctaButton}>
          Jugar otra vez
        </button>

        <button
          onClick={() => setPantalla("juego-historial")}
          style={styles.linkVolver}
        >
          🕓 Ver historial
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // 🕓 HISTORIAL DE PARTIDAS
  if (pantalla === "juego-historial") {
    const historial = obtenerHistorialJuego();
    void refrescoHistorial; // fuerza a releer el historial tras borrar

    function confirmarVaciarHistorial() {
      if (window.confirm("¿Borrar todo el historial de partidas? Esto no se puede deshacer.")) {
        vaciarHistorialJuego();
      }
    }

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Historial de partidas</h1>
          <div style={styles.menuUnderline} />
        </div>

        {historial.length === 0 ? (
          <p style={styles.configSubLabel}>
            Todavía no habéis jugado ninguna partida.
          </p>
        ) : (
          <>
            <button onClick={confirmarVaciarHistorial} style={styles.linkVolver}>
              🗑️ Vaciar historial
            </button>

            {historial.map((partida, i) => (
              <div key={i} style={styles.configCard}>
                <div style={styles.configRow}>
                  <p style={styles.configCardTitle}>{partida.fecha}</p>
                  <button
                    onClick={() => eliminarPartidaHistorial(i)}
                    title="Eliminar esta partida"
                    style={styles.borrarPartidaBtn}
                  >
                    🗑️
                  </button>
                </div>
                <p style={styles.configSubLabel}>
                  {partida.ganador === "Empate"
                    ? "Resultado: empate"
                    : `Ganadora: ${partida.ganador}`}
                </p>
                {partida.jugadores.map((j, k) => (
                  <div key={k} style={{ ...styles.resultRow, fontSize: 13 }}>
                    <span>{j.nombre}</span>
                    <b>
                      {j.aciertos} ✅ / {j.errores} ❌
                    </b>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
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

// 🔥 racha de estudio (días consecutivos)
function obtenerRacha() {
  return JSON.parse(localStorage.getItem(CLAVE_RACHA)) || {
    ultimaFecha: null,
    racha: 0
  };
}

function actualizarRacha() {
  const hoy = new Date().toISOString().slice(0, 10);
  const datos = obtenerRacha();

  if (datos.ultimaFecha === hoy) return;

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().slice(0, 10);

  const nuevaRacha = datos.ultimaFecha === ayerStr ? datos.racha + 1 : 1;

  localStorage.setItem(
    CLAVE_RACHA,
    JSON.stringify({ ultimaFecha: hoy, racha: nuevaRacha })
  );
}

// ⏱️ tiempo medio por pregunta
function obtenerTiempos() {
  return JSON.parse(localStorage.getItem(CLAVE_TIEMPOS)) || {
    totalSegundos: 0,
    totalPreguntas: 0
  };
}

function registrarTiempoPregunta(segundos) {
  const datos = obtenerTiempos();
  datos.totalSegundos += segundos;
  datos.totalPreguntas += 1;
  localStorage.setItem(CLAVE_TIEMPOS, JSON.stringify(datos));
}

// ⭐ favoritos
function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem(CLAVE_FAVORITOS)) || [];
}

function guardarFavoritos(lista) {
  localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));
}

// 🎮 historial de partidas del minijuego (independiente de las estadísticas personales)
function obtenerHistorialJuego() {
  return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL_JUEGO)) || [];
}

function guardarPartidaHistorial(puntuaciones) {
  const historial = obtenerHistorialJuego();

  const maxAciertos = Math.max(...puntuaciones.map((p) => p.aciertos));
  const ganadoras = puntuaciones
    .filter((p) => p.aciertos === maxAciertos)
    .map((p) => p.nombre);
  const ganador = ganadoras.length > 1 ? "Empate" : ganadoras[0];

  const nuevaPartida = {
    fecha: new Date().toLocaleString(),
    jugadores: puntuaciones,
    ganador
  };

  const actualizado = [nuevaPartida, ...historial].slice(0, 20);
  localStorage.setItem(CLAVE_HISTORIAL_JUEGO, JSON.stringify(actualizado));
}

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

const globalStyles = `
  .menu-btn, .pill, .bloque-chip {
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  }
  .menu-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.12);
  }
  .menu-btn:active {
    transform: translateY(0) scale(0.98);
  }
  .bloque-chip:hover {
    background: #efe8da;
    transform: translateY(-1px);
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
  @keyframes caerConfeti {
    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
  }
  .confeti-pieza {
    position: fixed;
    top: 0;
    width: 8px;
    height: 14px;
    animation-name: caerConfeti;
    animation-timing-function: ease-in;
    animation-fill-mode: forwards;
    pointer-events: none;
    z-index: 999;
  }
  @keyframes archivosVibrar {
    10%, 90% { transform: translateX(-2px); }
    20%, 80% { transform: translateX(4px); }
    30%, 50%, 70% { transform: translateX(-6px); }
    40%, 60% { transform: translateX(6px); }
  }
  .archivos-shake {
    animation: archivosVibrar 0.4s;
  }
`;

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
    color: "#333",
    cursor: "pointer"
  },
  explicacionCaja: {
    background: "#faf7f2",
    border: "1px solid #e4ddcf",
    borderRadius: 10,
    padding: "12px 14px",
    marginTop: 10,
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: "left",
    color: "#4a463f"
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

  // 🟣 contenedor general estilo "app"
  menuContainer: {
    maxWidth: 480,
    margin: "0 auto",
    minHeight: "100vh",
    padding: "40px 20px 60px",
    fontFamily: "Arial",
    background: "linear-gradient(180deg, #faf7f2 0%, #f2ece0 100%)",
    boxSizing: "border-box"
  },
  muerteJugandoContainer: {
    maxWidth: 960,
    margin: "0 auto",
    minHeight: "100vh",
    padding: "40px 12px 60px 4px",
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
  btnMint: { background: "#c9e4d0" },
  btnMuted: { background: "#efece4", color: "#a39d8e" },
  badgeProximamente: {
    float: "right",
    fontSize: 10,
    fontWeight: 700,
    background: "#fff",
    color: "#a39d8e",
    padding: "3px 8px",
    borderRadius: 10
  },
  linkVolver: {
    display: "block",
    width: "100%",
    textAlign: "center",
    border: "none",
    background: "transparent",
    color: "#8a8578",
    fontSize: 13,
    padding: 12,
    marginTop: 6,
    cursor: "pointer"
  },

  // ⚙️ tarjetas de configuración
  configCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 18,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
  },
  configCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#4a463f",
    marginBottom: 12
  },
  configRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  configSubLabel: {
    fontSize: 13,
    color: "#8a8578"
  },
  numeroInput: {
    border: "1px solid #e4ddcf",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    width: 80
  },
  nombreInput: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e4ddcf",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 8
  },

  // 🔘 pills genéricas reutilizables
  pillGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    background: "#faf7f2",
    padding: 4,
    borderRadius: 20
  },
  pillBtn: {
    border: "none",
    background: "transparent",
    padding: "8px 16px",
    borderRadius: 16,
    fontSize: 13,
    color: "#8a8578",
    cursor: "pointer"
  },
  pillBtnActiva: {
    background: "#e29aa0",
    color: "#fff",
    fontWeight: 700
  },

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
    gap: 8,
    marginTop: 14
  },
  bloqueChip: {
    border: "1px solid #e4ddcf",
    background: "#fff",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    color: "#4a463f",
    cursor: "pointer"
  },
  bloqueChipActiva: {
    background: "#e29aa0",
    color: "#fff",
    borderColor: "#e29aa0"
  },

  // 🎯 botón grande de acción principal
  ctaButton: {
    display: "block",
    width: "100%",
    border: "none",
    borderRadius: 20,
    padding: "18px 20px",
    marginTop: 10,
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(90deg, #f2b366, #e29aa0)",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(226,154,160,0.35)",
    textAlign: "center"
  },
  ctaButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none"
  },

  // 📊 tarjetas de estadísticas
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 20
  },
  statCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#4a463f"
  },
  statLabel: {
    fontSize: 11,
    color: "#8a8578",
    marginTop: 4
  },

  // 📝 simulacro
  simHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8
  },
  simTimer: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e29aa0",
    background: "#fff",
    padding: "6px 14px",
    borderRadius: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  simFinalizarBtn: {
    border: "none",
    background: "#f3cdd2",
    color: "#4a463f",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer"
  },
  simDotsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    maxHeight: 110,
    overflowY: "auto",
    marginBottom: 18,
    padding: 8,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  simDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1px solid #e4ddcf",
    background: "#fff",
    fontSize: 11,
    color: "#8a8578",
    cursor: "pointer"
  },
  simDotRespondida: {
    background: "#d7dcc0",
    borderColor: "#d7dcc0",
    color: "#4a463f"
  },
  simDotActual: {
    border: "2px solid #e29aa0"
  },
  simRespuestaBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    marginBottom: 10,
    borderRadius: 14,
    border: "1px solid #e4ddcf",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14
  },
  simRespuestaSeleccionada: {
    background: "#d9cdf0",
    borderColor: "#a992d9"
  },
  simNavRow: {
    display: "flex",
    gap: 10,
    marginTop: 16
  },
  simNavBtn: {
    flex: 1,
    border: "none",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    color: "#4a463f"
  },

  // 🏁 resultados
  resultCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    marginTop: 4,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f0ece2",
    fontSize: 14
  },

  // 🎬 vídeo de celebración
  videoContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    margin: 0,
    overflow: "hidden",
    background: "#faf7f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  videoElement: {
    maxWidth: "100%",
    maxHeight: "100%",
    display: "block"
  },
  skipButton: {
    position: "absolute",
    top: 20,
    right: 20,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    color: "#4a463f",
    padding: "8px 16px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  borrarPartidaBtn: {
    border: "none",
    background: "transparent",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1
  },

// 🎬 vídeo fusionado dentro de la pantalla de resultado
videoResultadoWrap: {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: 20,
  overflow: "hidden",
  marginBottom: 18,
  background: "#faf7f2",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
},
videoElementInline: {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "top",
  display: "block"
},
etiquetaNombreVideo: {
  position: "absolute",
  transform: "translateY(-100%)",
  background: "#fff",
  color: "#4a463f",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  whiteSpace: "nowrap",
  pointerEvents: "none"
},

  // 🥇 fila de jugadora desplegable con sus fallos
  filaJugadoraBtn: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    border: "none",
    background: "transparent",
    padding: "10px 0",
    borderBottom: "1px solid #f0ece2",
    fontSize: 14,
    cursor: "pointer",
    color: "#4a463f",
    fontFamily: "Arial"
  },
  fallosWrap: {
    padding: "8px 4px 14px",
    borderBottom: "1px solid #f0ece2"
  },
  falloItem: {
    background: "#faf7f2",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 8,
    fontSize: 13,
    textAlign: "left"
  },

// ☠️ layout de "Salva a tu trabajadora social" (pregunta arriba, imagen fija a la izquierda, respuestas a la derecha)
muertePreguntaTitulo: {
  textAlign: "center",
  marginBottom: 14
},
muerteLayout: {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 6
},
muerteImagenCol: {
  flex: "0 0 30%",
  background: "transparent",
  boxShadow: "none",
  borderRadius: 0
},
muerteImagen: {
  width: "100%",
  height: "auto",
  display: "block",
  transform: "scale(2.3)",
  transformOrigin: "top center"
},
muertePreguntaCol: {
  flex: 1,
  minWidth: 0
},

  // 🎮 fila de minijuego con miniatura, en el hub de Minijuegos
  filaMinijuegoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    border: "none",
    background: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    textAlign: "left",
    fontFamily: "Arial"
  },
  miniaturaMinijuego: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: "cover",
    flexShrink: 0
  },
  filaMinijuegoTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: 600,
    color: "#4a463f"
  },
  miniaturaMinijuegoEmoji: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: "#f2ece0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    flexShrink: 0
  },

  // 📁 layout del juego de emparejar "Conecta la Constitución"
  archivosColumnas: {
    display: "flex",
    gap: 10
  },
  archivosColumna: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  archivosTarjeta: {
    border: "1px solid #e4ddcf",
    background: "#fff",
    borderRadius: 14,
    padding: "14px 10px",
    fontSize: 13,
    color: "#4a463f",
    cursor: "pointer",
    textAlign: "center",
    transition: "background 0.2s ease, border-color 0.2s ease, opacity 0.3s ease, transform 0.3s ease",
    fontFamily: "Arial"
  },
  archivosTarjetaDescripcion: {
    textAlign: "left",
    lineHeight: 1.4
  },
  archivosTarjetaSeleccionada: {
    borderColor: "#e29aa0",
    background: "#f3cdd2"
  },
  archivosTarjetaCorrecta: {
    borderColor: "#7fb27f",
    background: "#d4edda"
  },
  archivosTarjetaError: {
    borderColor: "#c96a6a",
    background: "#f8d7da"
  },

// ☠️ pantalla de derrota: imagen de fondo fija (como la portada) + overlay que nunca se corta
derrotaContainer: {
  position: "relative",
  width: "100vw",
  minHeight: "100vh",
  background: "#f5f1ea",
  overflow: "visible"
},
derrotaImagenFondo: {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100vh",
  objectFit: "contain",
  display: "block"
},
derrotaTituloTop: {
  position: "absolute",
  top: "6%",
  left: 0,
  right: 0,
  padding: "0 24px",
  fontSize: 16,
  fontWeight: 800,
  color: "#c0392b",
  lineHeight: 1.35,
  letterSpacing: 0.2,
  textAlign: "center",
  textShadow: "0 1px 4px rgba(255,255,255,0.85)"
},
derrotaOverlayInferior: {
  position: "relative",
  marginTop: "78vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "0 24px 24px",
  boxSizing: "border-box"
},
  derrotaSubtitulo: {
    color: "#5a5147",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
    textShadow: "0 1px 4px rgba(255,255,255,0.75)"
  },
  derrotaBoton: {
    display: "block",
    width: "100%",
    maxWidth: 320,
    border: "none",
    borderRadius: 20,
    padding: "16px 20px",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(90deg, #f2b366, #e29aa0)",
    cursor: "pointer",
    marginTop: 6,
    boxShadow: "0 8px 20px rgba(226,154,160,0.35)"
  },
  derrotaLinkVolver: {
    display: "block",
    width: "100%",
    maxWidth: 320,
    textAlign: "center",
    border: "none",
    background: "transparent",
    color: "#5a5147",
    fontSize: 13,
    padding: 10,
    marginTop: 4,
    cursor: "pointer",
    textShadow: "0 1px 4px rgba(255,255,255,0.75)"
  },

  // 🏛️ edificio visual de "Construye la Constitución"
  edificioTejado: {
    width: 0,
    height: 0,
    margin: "0 auto",
    borderLeft: "18px solid transparent",
    borderRight: "18px solid transparent",
    borderBottom: "16px solid #8a8578"
  },
  edificioPisos: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    width: "100%",
    maxWidth: 280,
    margin: "0 auto 20px"
  },
  edificioPiso: {
    height: 16,
    borderRadius: 4,
    transition: "background 0.4s ease"
  },
  construyeCasillaNombre: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "1px dashed #c9c2b4",
    background: "#faf7f2",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 700,
    color: "#4a463f",
    cursor: "pointer"
  },
  edificioMarcoDetalle: {
    maxWidth: 220,
    margin: "0 auto 20px"
  },
  edificioMarco: {
    maxWidth: 320,
    margin: "0 auto 10px"
  },
  edificioTechoImg: {
    display: "block",
    width: "100%"
  },
  edificioPlantaBajaImg: {
    display: "block",
    width: "100%"
  },
  edificioPlantasWrap: {
    display: "flex",
    flexDirection: "column"
  },
  edificioPlanta: {
    padding: "14px 16px",
    borderLeft: "6px solid rgba(0,0,0,0.08)",
    borderRight: "6px solid rgba(0,0,0,0.08)"
  },
  edificioPlantaTitulo: {
    fontWeight: 700,
    color: "#4a463f",
    margin: "0 0 2px",
    fontSize: 14
  },
  edificioPlantaSubtitulo: {
    fontSize: 12,
    color: "#6b6558",
    marginBottom: 8
  },
  archiveroGlobo: {
    marginTop: 8,
    background: "#fff",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 13,
    color: "#4a463f",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  archiveroPresentacion: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "16px 0"
  },
  archiveroFoto: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  archiveroGloboPresentacion: {
    background: "#fff",
    borderRadius: 16,
    padding: "10px 14px",
    fontSize: 13,
    color: "#4a463f",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    flex: 1
  }
};

styles.placeholderContainer = {
  ...styles.menuContainer,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center"
};

styles.placeholderCard = {
  background: "#fff",
  borderRadius: 20,
  padding: "40px 30px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  maxWidth: 320
};

styles.placeholderEmoji = {
  fontSize: 42,
  marginBottom: 10
};