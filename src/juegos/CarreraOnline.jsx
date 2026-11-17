import { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { styles, globalStyles } from "../estilos";
import {
  COLORES_CORREDORA,
  crearSala,
  unirseSala,
  vigilarSala,
  salirDeSala,
  borrarSala,
  cambiarConfig,
  empezarCarrera,
  guardarMiProgreso,
  terminarCarrera,
  reiniciarParaRevancha
} from "../servicios/salas";
import { anadirCompis } from "../servicios/compis";
import corredoraRosa from "../assets/kit/corredora-rosa.png";
import corredoraMorado from "../assets/kit/corredora-morado.png";
import corredoraVerde from "../assets/kit/corredora-verde.png";
import corredoraAmarillo from "../assets/kit/corredora-amarillo.png";

// 🎨 la imagen de cada corredora (más adelante aquí entrarán los avatares)
const IMAGEN_CORREDORA = {
  rosa: corredoraRosa,
  morado: corredoraMorado,
  verde: corredoraVerde,
  amarillo: corredoraAmarillo
};

const CLAVE_NOMBRE = "opo_carrera_nombre_v1";
const CLAVE_SALA = "opo_carrera_sala_v1"; // para volver a entrar si sales sin querer

// ⏳ si alguien se queda parada: 2 min de margen + 1 min de cuenta atrás
const ESPERA_INACTIVIDAD = 120;
const CUENTA_ATRAS = 60;
const MARGEN_SIN_CONEXION = 30; // por si su móvil se ha apagado

function mezclar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// solo lo necesario para jugar (sin explicaciones, para que la sala pese poco)
function prepararPregunta(p) {
  const respuestas = p.respuestas.map((r, i) => ({ texto: r, indexOriginal: i }));
  const mezcladas = mezclar(respuestas);
  return {
    pregunta: p.pregunta,
    respuestas: mezcladas.map((r) => r.texto),
    correcta: mezcladas.findIndex((r) => r.indexOriginal === p.correcta)
  };
}

function mensajeError(e) {
  if (e && e.code === "permission-denied")
    return "No se ha podido entrar en la partida. Comprueba que tu cuenta está aprobada.";
  if (e && e.code === "unavailable") return "Para jugar online necesitas conexión a internet.";
  return (e && e.message) || "Algo ha fallado. Inténtalo otra vez.";
}

// ✨ microanimaciones suaves (puntos que esperan, corredoras que trotan, números de salida)
const cssOnline = `
  .puntos-espera::after { content: ""; animation: puntosEspera 1.8s steps(4) infinite; }
  @keyframes puntosEspera { 0% { content: ""; } 25% { content: "."; } 50% { content: ".."; } 75% { content: "..."; } }
  .trote { animation: trote 1.4s ease-in-out infinite; }
  @keyframes trote { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  .numero-salida { animation: numeroSalida 0.85s ease-out both; }
  @keyframes numeroSalida { from { transform: scale(1.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .respuesta-online:focus { outline: none; }
  .aviso-fondo { animation: avisoFondo 0.3s ease-out both; }
  @keyframes avisoFondo { from { opacity: 0; } to { opacity: 1; } }
  .aviso-tarjeta { animation: avisoTarjeta 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
  @keyframes avisoTarjeta { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
`;

// 😅 si alguien rechaza la revancha
const FRASES_RECHAZO = [
  (n) => `${n} dice que hoy no: se va a casa a repasar a escondidas 📚`,
  (n) => `${n} rechaza la revancha. Necesita un café y recuperar la dignidad ☕`,
  (n) => `${n} se retira con la cabeza bien alta. Revancha denegada 🙅`,
  (n) => `${n} ha pedido un aplazamiento… como si fuera un recurso de alzada 📄`,
  (n) => `${n} no acepta: dice que vuelve cuando se haya leído la Ley 39 entera 😅`
];

function fraseRechazo(nombre) {
  let suma = 0;
  for (const letra of nombre) suma += letra.charCodeAt(0);
  return FRASES_RECHAZO[suma % FRASES_RECHAZO.length](nombre);
}

const ESPERA_CORDONES = 45; // si alguien no pulsa "¡Empecemos!", se sale sin esperar

const est = {
  franja: {
    background: "#f7f1e8",
    border: "1px solid #eadfcd",
    borderRadius: 22,
    padding: "10px 14px",
    margin: "10px 0 16px",
    position: "relative"
  },
  carril: { position: "relative", height: 46, borderBottom: "1px dashed #e2d6c2" },
  ficha: {
    position: "absolute",
    bottom: 2,
    height: 42,
    width: 34,
    objectFit: "contain",
    transition: "left 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  nombreCarril: { position: "absolute", right: 6, top: 3, fontSize: 11, color: "#8a8173" },
  meta: { position: "absolute", top: 8, bottom: 8, right: 10, borderRight: "3px dotted #d9b98a" },
  codigoGrande: {
    fontSize: 36,
    letterSpacing: 10,
    fontWeight: 700,
    color: "#5b4a3a",
    textAlign: "center",
    margin: "4px 0 6px"
  },
  fila: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f0e7da" },
  imgFila: { width: 40, height: 50, objectFit: "contain" },
  heroFila: { display: "flex", justifyContent: "center", gap: 6, margin: "6px 0 14px" },
  heroImg: { width: 56, height: 72, objectFit: "contain" },
  error: { color: "#c96a6a", textAlign: "center", fontSize: 14, margin: "10px 0" },
  // elegir crear / unirme
  opcion: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    background: "transparent",
    border: "none",
    padding: "16px 4px",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  opcionSeparador: { height: 1, background: "#f0e7da", margin: "0 4px" },
  opcionTitulo: { fontSize: 17, fontWeight: 700, color: "#4a463f", margin: 0 },
  opcionTexto: { fontSize: 13, color: "#8a8173", margin: "3px 0 0" },
  opcionFlecha: { marginLeft: "auto", fontSize: 22, color: "#c9b9a3" },
  // sala de espera
  etiquetaSuave: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#a39a8c", margin: "0 0 6px" },
  lineaSalida: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
    margin: "6px 20px 14px",
    paddingBottom: 4,
    borderBottom: "2px dashed #d9c7a8"
  },
  salidaImg: { width: 44, height: 56, objectFit: "contain" },
  chips: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 12 },
  chipLavanda: { background: "#efe7f6", color: "#6b5a7a", borderRadius: 999, padding: "6px 12px", fontSize: 13 },
  chipSalvia: { background: "#e4ead8", color: "#5d6b4f", borderRadius: 999, padding: "6px 12px", fontSize: 13 },
  esperando: { fontSize: 14, color: "#8a8173", margin: 0 },
  // salida 3, 2, 1
  salida: { textAlign: "center", marginTop: 50 },
  salidaPregunta: { fontSize: 22, fontWeight: 700, color: "#5b4a3a", margin: "0 0 4px" },
  salidaEmpecemos: { fontSize: 18, color: "#c98a7a", margin: 0 },
  numero: { fontSize: 120, fontWeight: 800, color: "#d99a86", lineHeight: 1, margin: "30px 0" },
  // avisos
  avisoParada: {
    background: "#f6e6e6",
    border: "1px solid #ecd0d0",
    borderRadius: 18,
    padding: "10px 14px",
    margin: "0 0 14px",
    textAlign: "center",
    color: "#8a5a5a",
    fontSize: 14
  },
  pillParada: {
    display: "inline-block",
    background: "#f6e6e6",
    color: "#8a5a5a",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    marginTop: 6
  },
  // quién sigue corriendo
  filaCarrera: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0e7da" },
  imgMini: { width: 34, height: 44, objectFit: "contain", flexShrink: 0 },
  filaCabecera: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#4a463f" },
  barra: { height: 7, background: "#f0e7da", borderRadius: 999, marginTop: 6, overflow: "hidden" },
  barraRelleno: { height: "100%", background: "linear-gradient(90deg, #d7dcc0, #b9c79e)", borderRadius: 999 },
  // cordones
  cordonesFila: { display: "flex", justifyContent: "center", gap: 14, margin: "10px 0 18px" },
  cordonesPersona: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 64 },
  cordonesNombre: { fontSize: 11, color: "#8a8173", textAlign: "center", lineHeight: 1.2 },
  // avisos emergentes (revancha)
  avisoFondo: {
    position: "fixed",
    inset: 0,
    background: "rgba(74, 70, 63, 0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 1000
  },
  avisoTarjeta: {
    background: "linear-gradient(160deg, #fbf8f3, #f4ecf6)",
    borderRadius: 28,
    padding: "24px 20px 14px",
    width: "100%",
    maxWidth: 360,
    boxSizing: "border-box",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(74, 70, 63, 0.18)"
  },
  avisoTitulo: { fontSize: 18, fontWeight: 700, color: "#4a463f", margin: "0 0 6px" },
  avisoTexto: { fontSize: 15, color: "#6f675c", margin: "0 0 4px", lineHeight: 1.4 }
};

// 🏃‍♀️ la franja de la plaza: cada corredora avanza según sus aciertos
function FranjaPlaza({ lista, total }) {
  return (
    <div style={est.franja}>
      <div style={est.meta} />
      {lista.map((j) => {
        const avance = total > 0 ? j.aciertos / total : 0;
        return (
          <div key={j.uid} style={est.carril}>
            <img
              src={IMAGEN_CORREDORA[j.color]}
              alt={j.nombre}
              style={{ ...est.ficha, left: `calc((100% - 50px) * ${avance})` }}
            />
            <span style={est.nombreCarril}>
              {j.nombre} · {j.aciertos}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CarreraOnline({ preguntasBase, volver, alTerminar, codigoInicial }) {
  const uid = getAuth().currentUser?.uid;

  const [paso, setPaso] = useState("elegir"); // elegir | crear | unirme
  const [nombre, setNombre] = useState(() => localStorage.getItem(CLAVE_NOMBRE) || "");
  const [codigoEscrito, setCodigoEscrito] = useState("");
  const [codigo, setCodigo] = useState(() => codigoInicial || localStorage.getItem(CLAVE_SALA) || null);
  const [sala, setSala] = useState(null);
  const [error, setError] = useState("");
  const [ocupada, setOcupada] = useState(false);
  const [seleccion, setSeleccion] = useState(null);
  const [indiceRespondido, setIndiceRespondido] = useState(0);
  const [cuenta, setCuenta] = useState(null); // null | 3 | 2 | 1
  const [ahora, setAhora] = useState(Date.now());
  const inicioRef = useRef(Date.now());
  const ultimaAccionRef = useRef(Date.now());
  const yaTerminadoRef = useRef(false);
  const vistoRef = useRef({});
  const cortadaRef = useRef(false);
  const esperandoListasRef = useRef(false);
  const cordonesDesdeRef = useRef(Date.now());
  const listaRef = useRef([]);

  // 💾 recordar en qué partida estoy, para poder volver a entrar
  useEffect(() => {
    if (codigo) localStorage.setItem(CLAVE_SALA, codigo);
    else localStorage.removeItem(CLAVE_SALA);
  }, [codigo]);

  // 👀 escuchar la sala en directo
  useEffect(() => {
    if (!codigo) return;
    const dejar = vigilarSala(
      codigo,
      (datos, desdeCache) => {
        // lo guardado en el móvil puede estar desactualizado: esperamos a lo del servidor
        if (!datos) {
          if (desdeCache) return;
          setError("Esa partida ya no existe.");
          setCodigo(null);
          setSala(null);
          return;
        }
        if (!datos.jugadoras || !datos.jugadoras[uid]) {
          if (desdeCache) return;
          setCodigo(null);
          setSala(null);
          return;
        }
        setSala(datos);
      },
      (e) => setError(mensajeError(e))
    );
    return dejar;
  }, [codigo, uid]);

  const lista = useMemo(() => {
    if (!sala || !sala.jugadoras) return [];
    return Object.entries(sala.jugadoras)
      .map(([id, j]) => ({ uid: id, ...j }))
      .sort((a, b) => COLORES_CORREDORA.indexOf(a.color) - COLORES_CORREDORA.indexOf(b.color));
  }, [sala]);
  listaRef.current = lista;

  const soyAnfitriona = !!sala && sala.anfitriona === uid;
  const anfitriona = sala && sala.jugadoras ? sala.jugadoras[sala.anfitriona] : null;
  const total = (sala && sala.preguntas && sala.preguntas.length) || 0;
  const yo = sala && sala.jugadoras ? sala.jugadoras[uid] : null;
  const todasListas = lista.length > 0 && lista.every((j) => j.lista);
  const todasTerminadas =
    !!sala && sala.estado === "jugando" && lista.length > 0 && lista.every((j) => j.terminada);
  const acabada = !!sala && (sala.estado === "terminada" || todasTerminadas);

  function arrancarReloj() {
    inicioRef.current = Date.now();
    ultimaAccionRef.current = Date.now();
    vistoRef.current = {};
    listaRef.current.forEach((j) => {
      vistoRef.current[j.uid] = { respondidas: j.respondidas, desde: Date.now() };
    });
  }

  // 👟 ¿Te ataste los cordones? → cuando todo el mundo pulsa "¡Empecemos!": 3, 2, 1…
  useEffect(() => {
    if (!sala || sala.estado !== "jugando") return;
    if (!todasListas) {
      if (!esperandoListasRef.current) cordonesDesdeRef.current = Date.now();
      esperandoListasRef.current = true;
      ultimaAccionRef.current = Date.now();
      return;
    }
    if (!esperandoListasRef.current) {
      // he vuelto a entrar con la carrera ya en marcha: sin cuenta atrás
      arrancarReloj();
      return;
    }
    esperandoListasRef.current = false;
    setCuenta(3);
    const pasos = [
      [900, 2],
      [1800, 1],
      [2700, null]
    ];
    const ids = pasos.map(([ms, valor]) =>
      setTimeout(() => {
        setCuenta(valor);
        if (valor === null) arrancarReloj();
      }, ms)
    );
    return () => ids.forEach(clearTimeout);
  }, [sala && sala.estado, todasListas]);

  // ⏳ si alguien no pulsa "¡Empecemos!" en 45 s, el móvil de quien organiza sale sin esperar
  useEffect(() => {
    if (!soyAnfitriona || !sala || sala.estado !== "jugando" || todasListas) return;
    if (Date.now() - cordonesDesdeRef.current < ESPERA_CORDONES * 1000) return;
    lista.forEach((j) => {
      if (j.lista) return;
      const { uid: idJugadora, ...datos } = j;
      guardarMiProgreso(codigo, idJugadora, { ...datos, lista: true }).catch(() => {});
    });
  }, [ahora]);

  function estoyLista() {
    if (!yo || yo.lista) return;
    guardarMiProgreso(codigo, uid, { ...yo, lista: true }).catch((e) => setError(mensajeError(e)));
  }

  // ⏱️ reloj de la carrera (cada segundo, solo mientras se juega)
  useEffect(() => {
    if (!sala || sala.estado !== "jugando") return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sala && sala.estado]);

  // 👀 apuntar cuándo ha respondido cada una por última vez
  useEffect(() => {
    lista.forEach((j) => {
      const visto = vistoRef.current[j.uid];
      if (!visto || visto.respondidas !== j.respondidas) {
        vistoRef.current[j.uid] = { respondidas: j.respondidas, desde: Date.now() };
      }
    });
  }, [lista]);

  const enCarrera = !!sala && sala.estado === "jugando" && todasListas && cuenta === null;
  const misSegundosParada = Math.floor((ahora - ultimaAccionRef.current) / 1000);
  const miCuentaAtras =
    enCarrera && yo && !yo.terminada && misSegundosParada >= ESPERA_INACTIVIDAD
      ? Math.max(0, ESPERA_INACTIVIDAD + CUENTA_ATRAS - misSegundosParada)
      : null;

  function segundosParada(j) {
    const visto = vistoRef.current[j.uid];
    return visto ? Math.floor((ahora - visto.desde) / 1000) : 0;
  }

  // ⌛ si se me acaba la cuenta atrás, llego a la meta con lo que llevo
  useEffect(() => {
    if (miCuentaAtras !== 0 || cortadaRef.current) return;
    cortadaRef.current = true;
    setSeleccion(null);
    guardarMiProgreso(codigo, uid, { ...yo, terminada: true, porTiempo: true }).catch((e) =>
      setError(mensajeError(e))
    );
  }, [miCuentaAtras]);

  // 🛟 red de seguridad: si a alguien se le apaga el móvil o pierde la conexión,
  // el móvil de la anfitriona la da por llegada cuando pasa su tiempo (+ un margen)
  useEffect(() => {
    if (!soyAnfitriona || !enCarrera) return;
    lista.forEach((j) => {
      if (j.uid === uid || j.terminada) return;
      if (segundosParada(j) >= ESPERA_INACTIVIDAD + CUENTA_ATRAS + MARGEN_SIN_CONEXION) {
        const { uid: idJugadora, ...datos } = j;
        guardarMiProgreso(codigo, idJugadora, { ...datos, terminada: true, porTiempo: true }).catch(() => {});
      }
    });
  }, [ahora]);

  // 🏁 cuando llegan todas → clasificación con el vídeo
  useEffect(() => {
    if (!acabada || yaTerminadoRef.current) return;
    yaTerminadoRef.current = true;
    if (soyAnfitriona && sala.estado !== "terminada") terminarCarrera(codigo).catch(() => {});
    localStorage.removeItem(CLAVE_SALA);
    // 🤝 quienes han corrido contigo pasan a ser tus compis
    anadirCompis(uid, lista.filter((j) => j.uid !== uid)).catch(() => {});
    alTerminar(
      lista.map((j) => ({
        nombre: j.nombre,
        aciertos: j.aciertos,
        errores: j.errores,
        tiempoTotal: j.tiempoTotal,
        fallos: j.fallos || []
      })),
      codigo
    );
  }, [acabada]);

  function nombreLimpio() {
    const n = nombre.trim().slice(0, 20);
    if (n) localStorage.setItem(CLAVE_NOMBRE, n);
    return n;
  }

  async function crear() {
    const n = nombreLimpio();
    if (!n) return setError("Escribe tu nombre primero.");
    setOcupada(true);
    setError("");
    try {
      setCodigo(await crearSala(uid, n));
    } catch (e) {
      setError(mensajeError(e));
    }
    setOcupada(false);
  }

  async function unirse() {
    const c = codigoEscrito.trim().toUpperCase();
    if (c.length !== 4) return setError("El código tiene 4 caracteres.");
    const n = nombreLimpio();
    if (!n) return setError("Escribe tu nombre.");
    setOcupada(true);
    setError("");
    try {
      await unirseSala(c, uid, n);
      setCodigo(c);
    } catch (e) {
      setError(mensajeError(e));
    }
    setOcupada(false);
  }

  async function salir() {
    const c = codigo;
    const borrar = soyAnfitriona && sala && sala.estado === "espera";
    setCodigo(null);
    setSala(null);
    setPaso("elegir");
    try {
      if (borrar) await borrarSala(c);
      else await salirDeSala(c, uid);
    } catch (e) {
      // si falla al salir no pasa nada: la sala se queda sin usar
    }
  }

  function confirmarSalir() {
    const texto = soyAnfitriona
      ? "¿Cerrar la partida? Se cerrará para todo el grupo."
      : "¿Seguro que quieres salir de la partida?";
    if (window.confirm(texto)) salir();
  }

  function actualizarConfig(cambios) {
    cambiarConfig(codigo, { ...sala.config, ...cambios }).catch((e) => setError(mensajeError(e)));
  }

  function preguntasFuente(config) {
    if (config.tipo !== "bloques") return preguntasBase;
    return preguntasBase.filter((p) => config.bloques.includes(p.bloque || "Sin bloque"));
  }

  function empezar() {
    const preguntas = mezclar(preguntasFuente(sala.config))
      .slice(0, sala.config.numPreguntas)
      .map(prepararPregunta);
    empezarCarrera(codigo, preguntas).catch((e) => setError(mensajeError(e)));
  }

  function responder(i, evento) {
    if (evento && evento.currentTarget) evento.currentTarget.blur();
    if (seleccion !== null || !yo) return;
    const idx = yo.respondidas;
    const p = sala.preguntas[idx];
    if (!p) return;
    setSeleccion(i);
    setIndiceRespondido(idx);
    ultimaAccionRef.current = Date.now();

    const esCorrecta = i === p.correcta;
    const respondidas = idx + 1;
    guardarMiProgreso(codigo, uid, {
      ...yo,
      aciertos: yo.aciertos + (esCorrecta ? 1 : 0),
      errores: yo.errores + (esCorrecta ? 0 : 1),
      respondidas,
      tiempoTotal: (yo.tiempoTotal || 0) + (Date.now() - inicioRef.current),
      fallos: esCorrecta
        ? yo.fallos || []
        : [
            ...(yo.fallos || []),
            { pregunta: p.pregunta, respuestaDada: p.respuestas[i], correcta: p.respuestas[p.correcta] }
          ]
    }).catch((e) => setError(mensajeError(e)));
  }

  function siguiente() {
    const eraLaUltima = indiceRespondido + 1 >= total;
    setSeleccion(null);
    inicioRef.current = Date.now();
    ultimaAccionRef.current = Date.now();
    // 🏁 se llega a la meta al pulsar "Llegar a la meta", no al responder la última
    if (eraLaUltima && yo) {
      guardarMiProgreso(codigo, uid, { ...yo, terminada: true }).catch((e) => setError(mensajeError(e)));
    }
  }

  // ─────────── sin sesión ───────────
  if (!uid) {
    return (
      <div style={styles.menuContainer}>
        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <p style={styles.configCardTitle}>Para jugar online tienes que entrar con tu cuenta.</p>
        </div>
        <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>
      </div>
    );
  }

  // ─────────── entrar: primero elegir, luego el nombre ───────────
  if (!codigo) {
    return (
      <div style={styles.menuContainer}>
        <style>{cssOnline}</style>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Carrera online</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={est.heroFila}>
          {COLORES_CORREDORA.map((c) => (
            <img key={c} src={IMAGEN_CORREDORA[c]} alt="" style={est.heroImg} />
          ))}
        </div>

        {paso === "elegir" && (
          <>
            <div style={{ ...styles.configCard, padding: "6px 18px" }}>
              <button
                onClick={() => {
                  setError("");
                  setPaso("unirme");
                }}
                style={est.opcion}
              >
                <span>
                  <p style={est.opcionTitulo}>Unirme a una partida</p>
                  <p style={est.opcionTexto}>Tengo el código que me han pasado</p>
                </span>
                <span style={est.opcionFlecha}>›</span>
              </button>

              <div style={est.opcionSeparador} />

              <button
                onClick={() => {
                  setError("");
                  setPaso("crear");
                }}
                style={est.opcion}
              >
                <span>
                  <p style={est.opcionTitulo}>Crear una partida</p>
                  <p style={est.opcionTexto}>Elijo las preguntas y doy la salida</p>
                </span>
                <span style={est.opcionFlecha}>›</span>
              </button>
            </div>

            <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>
          </>
        )}

        {paso === "unirme" && (
          <>
            <div style={styles.configCard}>
              <p style={styles.configCardTitle}>Código de la partida</p>
              <input
                type="text"
                value={codigoEscrito}
                maxLength={4}
                onChange={(e) => setCodigoEscrito(e.target.value.toUpperCase())}
                placeholder="ABCD"
                style={{ ...styles.nombreInput, textAlign: "center", letterSpacing: 6, fontWeight: 700 }}
              />
              <p style={{ ...styles.configCardTitle, marginTop: 14 }}>Tu nombre en la carrera</p>
              <input
                type="text"
                value={nombre}
                maxLength={20}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Cómo quieres que te vean"
                style={styles.nombreInput}
              />
            </div>
            <button
              onClick={unirse}
              disabled={ocupada}
              style={{ ...styles.ctaButton, ...(ocupada ? styles.ctaButtonDisabled : {}) }}
            >
              Unirme
            </button>
            {error && <p style={est.error}>{error}</p>}
            <button onClick={() => setPaso("elegir")} style={styles.linkVolver}>⬅ Volver</button>
          </>
        )}

        {paso === "crear" && (
          <>
            <div style={styles.configCard}>
              <p style={styles.configCardTitle}>Tu nombre en la carrera</p>
              <input
                type="text"
                value={nombre}
                maxLength={20}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Cómo quieres que te vean"
                style={styles.nombreInput}
              />
            </div>
            <button
              onClick={crear}
              disabled={ocupada}
              style={{ ...styles.ctaButton, ...(ocupada ? styles.ctaButtonDisabled : {}) }}
            >
              Crear partida
            </button>
            {error && <p style={est.error}>{error}</p>}
            <button onClick={() => setPaso("elegir")} style={styles.linkVolver}>⬅ Volver</button>
          </>
        )}

        {paso === "elegir" && error && <p style={est.error}>{error}</p>}
      </div>
    );
  }

  if (!sala) {
    return (
      <div style={styles.menuContainer}>
        <style>{cssOnline}</style>
        <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 40 }}>
          Entrando en la partida<span className="puntos-espera" />
        </p>
        <button onClick={() => setCodigo(null)} style={styles.linkVolver}>⬅ Volver</button>
      </div>
    );
  }

  if (acabada) {
    return (
      <div style={styles.menuContainer}>
        <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 40 }}>
          Preparando la clasificación…
        </p>
      </div>
    );
  }

  // ─────────── sala de espera ───────────
  if (sala.estado === "espera") {
    const config = sala.config;
    const bloques = [...new Set(preguntasBase.map((p) => p.bloque || "Sin bloque"))];
    const disponibles = preguntasFuente(config).length;
    const suficientes = disponibles >= config.numPreguntas;
    const puedeEmpezar =
      lista.length >= 2 && (config.tipo === "general" || config.bloques.length > 0) && suficientes;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>
        <style>{cssOnline}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Sala de espera</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <p style={styles.configSubLabel}>Código de la partida</p>
          <p style={est.codigoGrande}>{codigo}</p>
          <p style={styles.configSubLabel}>Compártelo para que se unan a la carrera</p>
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>En la carrera ({lista.length}/4)</p>
          {lista.map((j) => (
            <div key={j.uid} style={est.fila}>
              <img src={IMAGEN_CORREDORA[j.color]} alt="" style={est.imgFila} />
              <span>
                {j.nombre}
                {j.uid === sala.anfitriona ? " · organiza" : ""}
                {j.uid === uid ? " (tú)" : ""}
              </span>
            </div>
          ))}
          {lista.length < 2 && (
            <p style={{ ...styles.configSubLabel, marginTop: 8 }}>Hace falta al menos una persona más.</p>
          )}
        </div>

        {soyAnfitriona ? (
          <>
            <div style={styles.configCard}>
              <p style={styles.configCardTitle}>Preguntas</p>
              <div style={styles.pillGroup}>
                {[
                  ["general", "General"],
                  ["bloques", "Por bloques"]
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    className="pill"
                    onClick={() => actualizarConfig({ tipo: valor })}
                    style={{ ...styles.pillBtn, ...(config.tipo === valor ? styles.pillBtnActiva : {}) }}
                  >
                    {texto}
                  </button>
                ))}
              </div>
              {config.tipo === "bloques" && (
                <div style={styles.bloquesGrid}>
                  {bloques.map((b) => (
                    <button
                      key={b}
                      className="bloque-chip"
                      onClick={() =>
                        actualizarConfig({
                          bloques: config.bloques.includes(b)
                            ? config.bloques.filter((x) => x !== b)
                            : [...config.bloques, b]
                        })
                      }
                      style={{
                        ...styles.bloqueChip,
                        ...(config.bloques.includes(b) ? styles.bloqueChipActiva : {})
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.configCard}>
              <p style={styles.configCardTitle}>Preguntas por persona</p>
              <div style={styles.pillGroup}>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    className="pill"
                    onClick={() => actualizarConfig({ numPreguntas: n })}
                    style={{ ...styles.pillBtn, ...(config.numPreguntas === n ? styles.pillBtnActiva : {}) }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {!suficientes && (
                <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 8 }}>
                  No hay preguntas suficientes ({disponibles} disponibles). Baja el número o elige más bloques.
                </p>
              )}
            </div>

            <button
              onClick={empezar}
              disabled={!puedeEmpezar}
              style={{ ...styles.ctaButton, ...(puedeEmpezar ? {} : styles.ctaButtonDisabled) }}
            >
              Dar la salida
            </button>
          </>
        ) : (
          <div style={{ ...styles.configCard, textAlign: "center" }}>
            <p style={est.etiquetaSuave}>En la línea de salida</p>
            <div style={est.lineaSalida}>
              {lista.map((j, i) => (
                <img
                  key={j.uid}
                  src={IMAGEN_CORREDORA[j.color]}
                  alt=""
                  className="trote"
                  style={{ ...est.salidaImg, animationDelay: `${i * 0.25}s` }}
                />
              ))}
            </div>
            <div style={est.chips}>
              <span style={est.chipLavanda}>
                {config.tipo === "bloques"
                  ? config.bloques.length > 0
                    ? config.bloques.join(" · ")
                    : "Bloques por elegir"
                  : "Preguntas generales"}
              </span>
              <span style={est.chipSalvia}>{config.numPreguntas} preguntas</span>
            </div>
            <p style={est.esperando}>
              Esperando a que {anfitriona ? anfitriona.nombre : "se"} dé la salida
              <span className="puntos-espera" />
            </p>
          </div>
        )}

        {error && <p style={est.error}>{error}</p>}

        <button onClick={confirmarSalir} style={styles.linkVolver}>
          {soyAnfitriona ? "Cerrar la partida" : "Salir de la partida"}
        </button>
      </div>
    );
  }

  // ─────────── salida: cordones (todo el mundo pulsa) y luego 3, 2, 1 ───────────
  if (!todasListas) {
    return (
      <div style={styles.menuContainer}>
        <style>{cssOnline}</style>
        <div style={est.salida}>
          <p style={est.salidaPregunta}>¿Te ataste los cordones?</p>
          <div style={est.cordonesFila}>
            {lista.map((j) => (
              <div key={j.uid} style={est.cordonesPersona}>
                <img
                  src={IMAGEN_CORREDORA[j.color]}
                  alt=""
                  className={j.lista ? "trote" : ""}
                  style={{ ...est.heroImg, opacity: j.lista ? 1 : 0.35, transition: "opacity 0.4s" }}
                />
                <span style={est.cordonesNombre}>
                  {j.nombre}
                  {j.lista ? " ✓" : ""}
                </span>
              </div>
            ))}
          </div>
          {yo && !yo.lista ? (
            <button onClick={estoyLista} style={styles.ctaButton}>
              ¡Empecemos!
            </button>
          ) : (
            <p style={est.esperando}>
              Esperando al resto
              <span className="puntos-espera" />
            </p>
          )}
          <p style={{ ...styles.configSubLabel, marginTop: 14 }}>
            Si en {ESPERA_CORDONES} s falta alguien, se sale sin esperar.
          </p>
          {error && <p style={est.error}>{error}</p>}
        </div>
      </div>
    );
  }

  if (cuenta !== null) {
    return (
      <div style={styles.menuContainer}>
        <style>{cssOnline}</style>
        <div style={est.salida}>
          <p key={cuenta} className="numero-salida" style={est.numero}>
            {cuenta}
          </p>
        </div>
      </div>
    );
  }

  // ─────────── he llegado: esperando al resto ───────────
  if (yo && (yo.terminada || yo.respondidas >= total) && seleccion === null) {
    const quedan = lista.filter((j) => !j.terminada);
    return (
      <div style={styles.menuContainer}>
        <style>{cssOnline}</style>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>¡Has llegado!</h1>
          <div style={styles.menuUnderline} />
        </div>

        <FranjaPlaza lista={lista} total={total} />

        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <img src={IMAGEN_CORREDORA[yo.color]} alt="" style={{ ...est.heroImg, width: 70, height: 90 }} />
          <p style={styles.configCardTitle}>
            {yo.aciertos} de {total} aciertos
          </p>
          {yo.porTiempo && (
            <p style={styles.configSubLabel}>Se acabó tu tiempo: cuenta lo que llevabas respondido.</p>
          )}
          <p style={est.esperando}>
            Esperando al resto
            <span className="puntos-espera" />
          </p>
        </div>

        {quedan.length > 0 && (
          <div style={styles.configCard}>
            <p style={est.etiquetaSuave}>Todavía en carrera</p>
            {quedan.map((j) => {
              const parada = segundosParada(j);
              const restante = ESPERA_INACTIVIDAD + CUENTA_ATRAS - parada;
              const hechas = Math.min(j.respondidas, total);
              return (
                <div key={j.uid} style={est.filaCarrera}>
                  <img src={IMAGEN_CORREDORA[j.color]} alt="" className="trote" style={est.imgMini} />
                  <div style={{ flex: 1 }}>
                    <div style={est.filaCabecera}>
                      <span>{j.nombre}</span>
                      <span style={{ color: "#8a8173" }}>
                        {hechas}/{total}
                      </span>
                    </div>
                    <div style={est.barra}>
                      <div style={{ ...est.barraRelleno, width: `${total ? (hechas / total) * 100 : 0}%` }} />
                    </div>
                    {parada >= ESPERA_INACTIVIDAD && (
                      <span style={est.pillParada}>
                        {restante > 0
                          ? `Lleva un rato sin responder · quedan unos ${restante} s`
                          : "Comprobando la conexión…"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <p style={est.error}>{error}</p>}
      </div>
    );
  }

  // ─────────── jugando ───────────
  const indice = seleccion !== null ? indiceRespondido : yo ? yo.respondidas : 0;
  const p = sala.preguntas[indice];
  if (!p) return null;

  function estiloRespuesta(i) {
    const base = { ...styles.simRespuestaBtn, outline: "none", color: "#4a463f" };
    if (seleccion === null) return base;
    if (i === p.correcta) return { ...base, background: "#e6eedb", borderColor: "#9db584" };
    if (i === seleccion) return { ...base, background: "#f6e0e0", borderColor: "#d9a0a0" };
    return { ...base, opacity: 0.55 };
  }

  return (
    <div style={styles.menuContainer}>
      <style>{cssOnline}</style>
      <div style={styles.simHeaderBar}>
        <span style={styles.simTimer}>
          Pregunta {indice + 1} / {total}
        </span>
        <span style={styles.simTimer}>{codigo}</span>
      </div>

      <FranjaPlaza lista={lista} total={total} />

      {miCuentaAtras !== null && (
        <div style={est.avisoParada}>
          <b>¿Sigues ahí?</b>
          <br />
          Si no respondes en {miCuentaAtras} s, llegarás a la meta con lo que llevas.
        </div>
      )}

      <h3>{p.pregunta}</h3>

      {p.respuestas.map((r, i) => (
        <button
          key={`${indice}-${i}`}
          className="respuesta-online"
          onClick={(e) => responder(i, e)}
          disabled={seleccion !== null}
          style={estiloRespuesta(i)}
        >
          {r}
        </button>
      ))}

      {seleccion !== null && (
        <>
          <p style={{ textAlign: "center", fontWeight: 700, color: seleccion === p.correcta ? "#6a9a6a" : "#c96a6a" }}>
            {seleccion === p.correcta ? "¡Bien! Avanzas una casilla" : "Esta no era"}
          </p>
          <button onClick={siguiente} style={styles.ctaButton}>
            {indice + 1 >= total ? "Llegar a la meta" : "Siguiente pregunta"}
          </button>
        </>
      )}

      {error && <p style={est.error}>{error}</p>}

      {seleccion === null && (
        <button
          onClick={() => {
            if (window.confirm("¿Abandonar la carrera?")) salir();
          }}
          style={styles.linkVolver}
        >
          Abandonar
        </button>
      )}
    </div>
  );
}

// 🔁 REVANCHA: botón en la clasificación + avisos emergentes
export function RevanchaOnline({ codigo, alEntrar }) {
  const uid = getAuth().currentUser?.uid;
  const [sala, setSala] = useState(null);
  const [descartada, setDescartada] = useState(false);
  const [rechazosVistos, setRechazosVistos] = useState([]);
  const [error, setError] = useState("");
  const entradoRef = useRef(false);
  const reiniciadaRef = useRef(false);

  useEffect(() => {
    if (!codigo) return;
    return vigilarSala(
      codigo,
      (datos) => setSala(datos),
      () => {}
    );
  }, [codigo]);

  const jugadoras = (sala && sala.jugadoras) || {};
  const yo = uid ? jugadoras[uid] : null;
  const otras = Object.entries(jugadoras)
    .filter(([id]) => id !== uid)
    .map(([id, j]) => ({ uid: id, ...j }));
  const soyAnfitriona = !!sala && sala.anfitriona === uid;
  const quienPide = otras.find((j) => j.quiereRevancha === "pide");
  const rechazos = otras.filter((j) => j.quiereRevancha === "no");
  const otrasQuieren = otras.some((j) => j.quiereRevancha === "pide" || j.quiereRevancha === "acepta");

  // si la sala vuelve a la espera y estoy dentro → a la sala
  useEffect(() => {
    if (sala && sala.estado === "espera" && yo && !entradoRef.current) {
      entradoRef.current = true;
      localStorage.setItem(CLAVE_SALA, codigo);
      alEntrar();
    }
  }, [sala, yo]);

  // quien organiza reabre la sala cuando quiere revancha y alguien más también
  useEffect(() => {
    if (!sala || !soyAnfitriona || sala.estado === "espera" || reiniciadaRef.current) return;
    if (yo && (yo.quiereRevancha === "pide" || yo.quiereRevancha === "acepta") && otrasQuieren) {
      reiniciadaRef.current = true;
      reiniciarParaRevancha(codigo, sala).catch((e) => setError(mensajeError(e)));
    }
  }, [sala]);

  if (!sala || !uid) return null;

  function responderRevancha(tipo) {
    guardarMiProgreso(codigo, uid, { ...yo, quiereRevancha: tipo }).catch((e) => setError(mensajeError(e)));
  }

  async function unirmeOtraVez() {
    try {
      await unirseSala(codigo, uid, localStorage.getItem(CLAVE_NOMBRE) || "Participante");
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  // ── aviso emergente ──
  let aviso = null;
  const rechazoPendiente =
    yo && yo.quiereRevancha === "pide" ? rechazos.find((j) => !rechazosVistos.includes(j.uid)) : null;

  if (rechazoPendiente) {
    aviso = (
      <>
        <p style={est.avisoTitulo}>Revancha rechazada</p>
        <p style={est.avisoTexto}>{fraseRechazo(rechazoPendiente.nombre)}</p>
        <button
          onClick={() => setRechazosVistos((v) => [...v, rechazoPendiente.uid])}
          style={{ ...styles.ctaButton, marginTop: 14 }}
        >
          Vale
        </button>
      </>
    );
  } else if (!descartada && sala.estado === "espera" && !yo && sala.revanchaDe) {
    aviso = (
      <>
        <p style={est.avisoTitulo}>{sala.revanchaDe} no se ha quedado conforme…</p>
        <p style={est.avisoTexto}>¿Quieres la revancha?</p>
        <button onClick={unirmeOtraVez} style={{ ...styles.ctaButton, marginTop: 14 }}>
          ¡Venga, otra!
        </button>
        <button onClick={() => setDescartada(true)} style={styles.linkVolver}>
          Por hoy ya está
        </button>
      </>
    );
  } else if (yo && !yo.quiereRevancha && quienPide && sala.estado !== "espera") {
    aviso = (
      <>
        <p style={est.avisoTitulo}>{quienPide.nombre} no se ha quedado conforme…</p>
        <p style={est.avisoTexto}>¿Quieres la revancha?</p>
        <button onClick={() => responderRevancha("acepta")} style={{ ...styles.ctaButton, marginTop: 14 }}>
          ¡Venga, otra!
        </button>
        <button onClick={() => responderRevancha("no")} style={styles.linkVolver}>
          Por hoy ya está
        </button>
      </>
    );
  }

  // ── en la página: botón o estado ──
  let enPagina = null;
  if (yo && sala.estado !== "espera") {
    if (!yo.quiereRevancha && !quienPide) {
      enPagina = (
        <button onClick={() => responderRevancha("pide")} style={styles.ctaButton}>
          🔁 Revancha con el mismo grupo
        </button>
      );
    } else if (yo.quiereRevancha === "pide") {
      const todasRechazan = otras.length > 0 && otras.every((j) => j.quiereRevancha === "no");
      enPagina = (
        <p style={{ ...est.esperando, textAlign: "center", margin: "6px 0 12px" }}>
          {todasRechazan ? (
            "Esta vez nadie se apunta a la revancha"
          ) : (
            <>
              Esperando respuesta a tu revancha
              <span className="puntos-espera" />
            </>
          )}
        </p>
      );
    }
  }

  return (
    <>
      <style>{cssOnline}</style>
      {enPagina}
      {error && <p style={est.error}>{error}</p>}
      {aviso && (
        <div className="aviso-fondo" style={est.avisoFondo}>
          <div className="aviso-tarjeta" style={est.avisoTarjeta}>
            {aviso}
          </div>
        </div>
      )}
    </>
  );
}