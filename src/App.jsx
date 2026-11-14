import { useEffect, useMemo, useState } from "react";
import { cargarPreguntas } from "./cargarPreguntas";
import portada from "./assets/portada.jpeg";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import iconoHubCarreraPlaza from "./assets/kit/icono-hub-carrera-plaza.png";
import iconoHubSalvaTrabajadora from "./assets/kit/icono-hub-salva-trabajadora.png";
import iconoHubConectaConstitucion from "./assets/kit/icono-hub-conecta-constitucion.png";
import iconoHubConstruyeConstitucion from "./assets/kit/icono-hub-construye-constitucion.png";
import { globalStyles, styles } from "./estilos";
import PersonajeFlotante from "./personajes/PersonajeFlotante";
import CuentaUsuario from "./componentes/CuentaUsuario";
import MisImpugnaciones from "./componentes/MisImpugnaciones";
import MiCalendario from "./componentes/MiCalendario";
import PantallaBloqueada from "./componentes/PantallaBloqueada";
import { useAcceso } from "./servicios/useAcceso";
import ConstruyeConstitucion from "./juegos/ConstruyeConstitucion";
import ConectaConstitucion from "./juegos/ConectaConstitucion";
import CarreraPlaza from "./juegos/CarreraPlaza";
import SalvaTrabajadoraSocial from "./juegos/SalvaTrabajadoraSocial";
import Estudiar from "./estudio/Estudiar";
import Simulacro from "./estudio/Simulacro";
import muerteImg0 from "./assets/trabajadora-0.png";
import casaIcono from "./assets/casa-icono.png";
import iconoLibro from "./assets/kit/icono-libro-estudiar.png";
import iconoReloj from "./assets/kit/icono-reloj-simulacro.png";
import iconoDados from "./assets/kit/icono-dados-minijuegos.png";
import iconoGrafico from "./assets/kit/icono-grafico-evolucion.png";
import iconoCarpeta from "./assets/kit/icono-carpeta-favoritos.png";
import iconoCalendario from "./assets/kit/icono-calendario-inicio.png";
import iconoTaza from "./assets/kit/icono-taza-perfil.png";
import iconoPlantita from "./assets/kit/icono-plantita-evolucion.png";
import iconoRachaLlama from "./assets/bookbrand/icono-brand-racha-llama.png";
import iconoPerfilSilueta from "./assets/kit/icono-perfil-silueta.png";
import iconoPerfilHero from "./assets/kit/icono-perfil-hero.png";
import iconoNube from "./assets/bookbrand/icono-brand-nube.png";
import iconoCandado from "./assets/kit/icono-candado.png";
import {
  obtenerStats,
  guardarStats,
  obtenerRacha,
  obtenerTiempos,
  obtenerFavoritos,
  guardarFavoritos,
  CLAVE_CODIGO,
  CLAVE_RACHA,
  CLAVE_TIEMPOS
} from "./servicios/progreso";

// 🧑‍🤝‍🧑 envuelve una pantalla con el personaje flotante global — se omite
// en la portada y en los juegos que ya tienen su propia burbuja interna
function conPersonaje(contenido) {
  return (
    <>
      {contenido}
      <PersonajeFlotante />
    </>
  );
}

// 📌 Array de frases de bienvenida — añade aquí nuevas cuando quieras
const FRASES_BIENVENIDA = [
  "venimos de personas que con la poesía cambiaron el mundo",
  "me declaro aprendiz imperecedera",
  "el conocimiento también se construye en sociedad"
];

export default function App() {
  const [preguntasBase, setPreguntasBase] = useState([]);
  const [pantalla, setPantalla] = useState(() =>
    window.location.hash === "#inicio" ? "inicio" : "landing"
  );
  const [frase] = useState(
    () => FRASES_BIENVENIDA[Math.floor(Math.random() * FRASES_BIENVENIDA.length)]
  );

  // 🔐 cuenta y estado de acceso ("cargando" | "sin-cuenta" | "pendiente" | "aprobada")
  const { usuario, estado: estadoAcceso } = useAcceso();
  const aprobada = estadoAcceso === "aprobada";
  // ☁️ el progreso se guarda en la nube, vinculado a la cuenta
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeSync, setMensajeSync] = useState("");

  function datosLocales() {
    return {
      stats: obtenerStats(),
      racha: obtenerRacha(),
      tiempos: obtenerTiempos(),
      favoritos: obtenerFavoritos(),
      actualizado: new Date().toISOString()
    };
  }

  function aplicarDatos(datos) {
    if (datos.stats) guardarStats(datos.stats);
    if (datos.racha) localStorage.setItem(CLAVE_RACHA, JSON.stringify(datos.racha));
    if (datos.tiempos) localStorage.setItem(CLAVE_TIEMPOS, JSON.stringify(datos.tiempos));
    if (datos.favoritos) guardarFavoritos(datos.favoritos);
  }

  async function sincronizarConNube() {
    if (!usuario) return;
    try {
      await setDoc(doc(db, "progreso", usuario.uid), datosLocales());
    } catch (e) {
      // fallo silencioso: los datos siguen a salvo en este dispositivo
    }
  }

  // al iniciar sesión: carga el progreso de la cuenta, o lo crea
  // (si había un código antiguo en este dispositivo, trae sus datos)
  async function cargarProgresoCuenta(u) {
    setSincronizando(true);
    try {
      const snap = await getDoc(doc(db, "progreso", u.uid));
      if (snap.exists()) {
        aplicarDatos(snap.data());
      } else {
        const codigoAntiguo = localStorage.getItem(CLAVE_CODIGO);
        if (codigoAntiguo) {
          const viejo = await getDoc(doc(db, "perfiles", codigoAntiguo));
          if (viejo.exists()) aplicarDatos(viejo.data());
        }
        await setDoc(doc(db, "progreso", u.uid), datosLocales());
      }
      localStorage.removeItem(CLAVE_CODIGO);
    } catch (e) {
      setMensajeSync("⚠️ No se pudo conectar. Comprueba tu conexión a internet.");
    }
    setSincronizando(false);
  }

  useEffect(() => {
    async function init() {
      const datos = await cargarPreguntas();
      setPreguntasBase(datos);
    }
    init();
  }, []);

  // ☁️ cuando hay sesión iniciada, carga el progreso de esa cuenta
  useEffect(() => {
    if (usuario) {
      cargarProgresoCuenta(usuario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.uid]);

  function volverMenu() {
    setPantalla("inicio");
    sincronizarConNube();
  }

// 🏠 el botón de pánico (definido en index.html) se oculta en Inicio y en la Portada
useEffect(() => {
  const boton = document.getElementById("boton-panico");
  if (boton) {
    const ocultarEn = pantalla === "inicio" || pantalla === "landing";
    boton.style.display = ocultarEn ? "none" : "block";
  }
}, [pantalla]);

  // 🔐 sin aprobación solo se ven las preguntas marcadas como demo en el Sheet
  const preguntasVisibles = useMemo(() => {
    if (aprobada) return preguntasBase;
    const grupoDemo = preguntasBase.filter((p) => p.demo);
    return [...grupoDemo].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [preguntasBase, aprobada]);

  // 🔐 pantallas que solo pueden usar las cuentas aprobadas
  const PANTALLAS_BLOQUEADAS = ["simulacro", "carrera", "muerte", "archivos", "calendario"];

  // 🔒 aspecto de las tarjetas bloqueadas (no se aplica mientras se comprueba la cuenta)
  const mostrarBloqueo = !aprobada && estadoAcceso !== "cargando";
  const estiloBloqueado = { opacity: 0.5, filter: "grayscale(35%)", position: "relative" };
  const candado = (
    <img
      src={iconoCandado}
      alt="Bloqueado"
      style={{ position: "absolute", top: 10, right: 10, width: 26 }}
    />
  );
  if (PANTALLAS_BLOQUEADAS.includes(pantalla) && !aprobada) {
    return conPersonaje(
      <PantallaBloqueada
        estado={estadoAcceso}
        irAPerfil={() => setPantalla("ajustes")}
        volverMenu={volverMenu}
      />
    );
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

// 🟣 MENÚ PRINCIPAL — INICIO (rediseño)
if (pantalla === "inicio") {
  const racha = obtenerRacha().racha;
  const statsInicio = obtenerStats();

  const totalRespondidas = Object.values(statsInicio).reduce((a, b) => a + (b.veces || 0), 0);
  const pendientesEstudio = Math.max(0, preguntasVisibles.length - Object.keys(statsInicio).length);

  const bloquesResumen = {};
  preguntasBase.forEach((p) => {
    const b = p.bloque || "Sin bloque";
    if (!bloquesResumen[b]) bloquesResumen[b] = { respondidas: 0, aciertos: 0 };
  });
  Object.values(statsInicio).forEach((s) => {
    const b = s.bloque || "Sin bloque";
    if (!bloquesResumen[b]) bloquesResumen[b] = { respondidas: 0, aciertos: 0 };
    bloquesResumen[b].respondidas += s.veces || 0;
    bloquesResumen[b].aciertos += s.aciertos || 0;
  });
  const bloquesConDatos = Object.values(bloquesResumen).filter((b) => b.respondidas > 0);
  const bloquesFavorables = bloquesConDatos.filter((b) => b.aciertos / b.respondidas >= 0.6).length;
  const bloquesSeguimiento = bloquesConDatos.filter((b) => b.aciertos / b.respondidas < 0.4).length;
  const porcentajeFavorable = bloquesConDatos.length
    ? Math.round((bloquesFavorables / bloquesConDatos.length) * 100)
    : 0;

    return conPersonaje(
      <div style={styles.menuContainer}>
        <div style={styles.inicioHeader}>
        <img src={casaIcono} alt="" style={styles.inicioCasaIcono} />
        <span style={styles.inicioHeaderTexto}>Inicio</span>
      </div>

      <div style={styles.inicioHeroCard}>
        <img src={iconoPlantita} alt="" style={styles.inicioHeroIcono} />
        <div style={styles.inicioHeroTexto}>
        <p style={{ ...styles.inicioHeroTitulo, ...styles.heroRachaRow }}>
            <img src={iconoRachaLlama} alt="" style={styles.iconoInlinePequeno} />
            ¡Llevas {racha} {racha === 1 ? "día" : "días"} seguidos!
          </p>
          <p style={styles.inicioHeroSubtitulo}>
            Estás construyendo tu futuro un día a la vez.
          </p>
          {pendientesEstudio > 0 && (
            <div style={styles.inicioHeroPill}>
              🌿 Hoy tienes {pendientesEstudio} preguntas nuevas por descubrir
            </div>
          )}
        </div>
      </div>

      <div style={styles.inicioGrid}>
        <button
          onClick={() => setPantalla("estudiar-estudio")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaLavanda }}
        >
          <img src={iconoLibro} alt="" style={styles.inicioTarjetaIcono} />
          <p style={styles.inicioTarjetaTitulo}>Estudiar</p>
          <p style={styles.inicioTarjetaSubtitulo}>Tests por bloques o generales</p>
          <div style={{ ...styles.inicioTarjetaLinea, background: "#b9a8de" }} />
        </button>

        <button
          onClick={() => setPantalla("simulacro")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaRosa, ...(mostrarBloqueo ? estiloBloqueado : {}) }}
        >
          {mostrarBloqueo && candado}
          <img src={iconoReloj} alt="" style={styles.inicioTarjetaIcono} />
          <p style={styles.inicioTarjetaTitulo}>Simulacro oficial</p>
          <p style={styles.inicioTarjetaSubtitulo}>Examen completo, 100 preguntas</p>
          <div style={{ ...styles.inicioTarjetaLinea, background: "#e2a3a9" }} />
        </button>

        <button
          onClick={() => setPantalla("minijuegos")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaSalvia }}
        >
<img src={iconoDados} alt="" style={styles.inicioTarjetaIconoGrande} />          <p style={styles.inicioTarjetaTitulo}>Minijuegos</p>
          <p style={styles.inicioTarjetaSubtitulo}>Repasa jugando y diviértete</p>
          <div style={{ ...styles.inicioTarjetaLinea, background: "#8fb89a" }} />
        </button>

        <button
          onClick={() => setPantalla("estudiar-progreso")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaBeige }}
        >
<img src={iconoGrafico} alt="" style={styles.inicioTarjetaIconoGrande} />          <p style={styles.inicioTarjetaTitulo}>Mi evolución</p>
          <p style={styles.inicioTarjetaSubtitulo}>Estadísticas, errores y favoritas</p>
          <div style={{ ...styles.inicioTarjetaLinea, background: "#d9a25c" }} />
        </button>

        <button
          onClick={() => setPantalla("calendario")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaMuted, ...(mostrarBloqueo ? estiloBloqueado : {}) }}
        >
          {mostrarBloqueo && candado}
          <img src={iconoCalendario} alt="" style={styles.inicioTarjetaIcono} />
          <p style={styles.inicioTarjetaTitulo}>Mi calendario</p>
          <p style={styles.inicioTarjetaSubtitulo}>Planifica tus días de estudio</p>
          <div style={{ ...styles.inicioTarjetaLinea, background: "#c3bcae" }} />
        </button>

        <button
          onClick={() => setPantalla("ajustes")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaLavandaClara }}
        >
          <img src={iconoTaza} alt="" style={styles.inicioTarjetaIcono} />
          <p style={styles.inicioTarjetaTitulo}>Mi perfil</p>
          <p style={styles.inicioTarjetaSubtitulo}>Sincroniza tu progreso</p>
          <div style={{ ...styles.inicioTarjetaLinea, background: "#b9a8de" }} />
        </button>
      </div>

      <div style={styles.inicioJardinCard}>
        <p style={styles.inicioJardinTitulo}>🌿 Tu jardín de conocimiento</p>
        <p style={styles.inicioJardinSubtitulo}>Cada respuesta es una raíz más fuerte.</p>

        <div style={styles.inicioJardinGrid}>
          <div style={styles.inicioJardinItem}>
            <p style={styles.inicioJardinValor}>{totalRespondidas}</p>
            <p style={styles.inicioJardinEtiqueta}>Preguntas aprendidas</p>
          </div>
          <div style={styles.inicioJardinItem}>
            <p style={styles.inicioJardinValor}>{porcentajeFavorable}%</p>
            <p style={styles.inicioJardinEtiqueta}>Bloques con evolución favorable</p>
          </div>
          <div style={styles.inicioJardinItem}>
            <p style={styles.inicioJardinValor}>{bloquesSeguimiento}</p>
            <p style={styles.inicioJardinEtiqueta}>Bloques necesitan seguimiento</p>
          </div>
          <div style={styles.inicioJardinItem}>
            <p style={styles.inicioJardinValor}>{racha}</p>
            <p style={styles.inicioJardinEtiqueta}>Tu racha actual</p>
          </div>
        </div>

        <button onClick={() => setPantalla("estudiar-progreso")} style={styles.inicioJardinBoton}>
          Ver mi evolución →
        </button>
      </div>

      <p style={styles.inicioFraseFinal}>"{frase}"</p>
    </div>
  );
}

// 🎮 HUB DE MINIJUEGOS
if (pantalla === "minijuegos") {
  const listaMinijuegos = [
    {
      id: "carrera",
      nombre: "Carrera por la Plaza",
      descripcion: "Compite respondiendo preguntas y llega el primero a la meta.",
      miniatura: iconoHubCarreraPlaza,
      colorFlecha: "#f3cdd2",
      destino: "carrera"
    },
    {
      id: "muerte",
      nombre: "Salva a tu trabajadora social",
      descripcion: "Responde rápido y ayuda a rescatarla antes de que sea tarde.",
      miniatura: iconoHubSalvaTrabajadora,
      colorFlecha: "#f6d7ae",
      destino: "muerte"
    },
    {
      id: "archivos",
      nombre: "Conecta la Constitución",
      descripcion: "Une artículos y conceptos para completar la conexión.",
      miniatura: iconoHubConectaConstitucion,
      colorFlecha: "#d7dcc0",
      destino: "archivos"
    },
    {
      id: "construye",
      nombre: "Construye la Constitución",
      descripcion: "Coloca cada parte de la Constitución en su lugar correcto.",
      miniatura: iconoHubConstruyeConstitucion,
      colorFlecha: "#d9cdf0",
      destino: "construye"
    }
  ];

  return conPersonaje(
    <div style={styles.menuContainer}>
      <style>{globalStyles}</style>

      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>Minijuegos</h1>
        <div style={styles.menuUnderline} />
      </div>

      <p style={styles.minijuegosSubtitulo}>
        Aprende jugando, repasa sin darte cuenta y disfruta del camino.
      </p>

      {listaMinijuegos.map((j) => (
        <button
          key={j.id}
          onClick={() => setPantalla(j.destino)}
          style={{
            ...styles.minijuegoFilaCard,
            ...(mostrarBloqueo && j.id !== "construye" ? estiloBloqueado : {})
          }}
        >
          {mostrarBloqueo && j.id !== "construye" && candado}
          <img src={j.miniatura} alt={j.nombre} style={styles.minijuegoFilaImg} />
          <div style={styles.minijuegoFilaTexto}>
            <p style={styles.minijuegoFilaTitulo}>{j.nombre}</p>
            <p style={styles.minijuegoFilaDescripcion}>{j.descripcion}</p>
          </div>
          <span style={{ ...styles.minijuegoFilaFlecha, background: j.colorFlecha }}>→</span>
        </button>
      ))}

      <button onClick={volverMenu} style={styles.linkVolver}>
        ⬅ Volver al menú
      </button>
    </div>
  );
}

// 🗓️ MI CALENDARIO
if (pantalla === "calendario") {
  return conPersonaje(
    <MiCalendario volverMenu={volverMenu} irAPerfil={() => setPantalla("ajustes")} />
  );
}

// ☠️ DETALLE DE "SALVA A TU TRABAJADORA SOCIAL"
if (pantalla === "muerte") {
    return (
      <SalvaTrabajadoraSocial
        preguntasBase={preguntasBase}
        setPantalla={setPantalla}
        volverMenu={volverMenu}
      />
    );
  }

  // 📖 ESTUDIAR
  if (pantalla === "estudiar-estudio") {
    return conPersonaje(
      <Estudiar
        preguntasBase={preguntasVisibles}
        volverMenu={volverMenu}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="config"
      />
    );
  }

  // 📈 MI EVOLUCIÓN
  if (pantalla === "estudiar-progreso") {
    return conPersonaje(
      <Estudiar
        preguntasBase={preguntasVisibles}
        volverMenu={volverMenu}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="progreso"
      />
    );
  }

  // 📝 SIMULACRO OFICIAL
  if (pantalla === "simulacro") {
    return <Simulacro preguntasBase={preguntasBase} volverMenu={volverMenu} />;
  }

  // 🏁 CARRERA POR LA PLAZA
  if (pantalla === "carrera") {
    return (
      <CarreraPlaza
        preguntasBase={preguntasBase}
        setPantalla={setPantalla}
        volverMenu={volverMenu}
      />
    );
  }

  // 🏛️ CONSTRUYE LA CONSTITUCIÓN
  if (pantalla === "construye") {
    return <ConstruyeConstitucion setPantalla={setPantalla} />;
  }

  // 📁 CONECTA LA CONSTITUCIÓN
  if (pantalla === "archivos") {
    return conPersonaje(<ConectaConstitucion setPantalla={setPantalla} volverMenu={volverMenu} />);
  }

  // ⚙️ AJUSTES — perfil y código de sincronización
  if (pantalla === "ajustes") {
    return conPersonaje(
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <div style={styles.perfilHeaderRow}>
            <h1 style={styles.menuTitle}>Mi perfil</h1>
            <img src={iconoPerfilSilueta} alt="" style={styles.perfilHeaderIcono} />
          </div>
          <div style={styles.menuUnderline} />
        </div>

        <img src={iconoPerfilHero} alt="" style={styles.perfilHeroImg} />

        <CuentaUsuario usuario={usuario} estadoAcceso={estadoAcceso} />

<MisImpugnaciones />

        <div style={styles.perfilNotaCard}>
          <span style={{ fontSize: 22 }}>🌸</span>
          <p style={{ margin: 0 }}>
            Tu progreso es importante. Guárdalo y nunca perderás lo que has conseguido. 💗
          </p>
        </div>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div style={styles.menuContainer}>
      <p style={styles.configSubLabel}>Pantalla no encontrada.</p>
      <button onClick={volverMenu} style={styles.linkVolver}>
        ⬅ Volver al menú
      </button>
    </div>
  );
}