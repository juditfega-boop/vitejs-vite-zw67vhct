import { useEffect, useMemo, useRef, useState } from "react";
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
import iconoReloj from "./assets/kit/icono-reloj-simulacro.png";
import iconoPerfilSilueta from "./assets/kit/icono-perfil-silueta.png";
import iconoPerfilHero from "./assets/kit/icono-perfil-hero.png";
import { leerBanco } from "./servicios/banco";
import Tarjetero from "./componentes/Tarjetero";
import Buzon from "./componentes/Buzon";
import MisCompis from "./componentes/MisCompis";
import MiIdentidad from "./componentes/MiIdentidad";
import IntroAnimada from "./componentes/IntroAnimada";
import BarraInferior, { PANTALLAS_CON_BARRA } from "./componentes/BarraInferior";
import InicioHoy from "./componentes/InicioHoy";
import MiExpediente from "./componentes/MiExpediente";
import GuiaVisita, { CLAVE_VISITA } from "./componentes/GuiaVisita";
import { TituloHub, SubtituloMano, Rejilla, Tile, COLOR_SECCION, FONDO_PAPEL, PAGINA, cssHub } from "./componentes/Hub";
import { useCalendario } from "./servicios/calendario";
import ErreDelDia from "./erre/ErreDelDia";
import iconoExplora from "./assets/kit/icono-explora.png";
import iconoErre from "./assets/kit/icono-hub-erre-que-erre.png";
import iconoTarjetero from "./assets/kit/icono-tarjetero.png";
import iconoRepaso from "./assets/kit/icono-repaso.png";
import iconoRepasarErrores from "./assets/kit/icono-repasar-errores-hero.png";
import iconoFavoritas from "./assets/kit/icono-favoritos-corazon.png";
import {
  obtenerStats,
  guardarStats,
  obtenerRacha,
  obtenerTiempos,
  obtenerFavoritos,
  clasificarErrores,
  guardarFavoritos,
  CLAVE_RACHA,
  CLAVE_TIEMPOS,
  obtenerNivelesErre,
  guardarNivelesErre
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
  // 🌱 animación de entrada: una vez cada vez que se abre la app (no al volver a la portada)
  const [verIntro, setVerIntro] = useState(
    () => window.location.hash !== "#inicio" && !sessionStorage.getItem("opo_intro_vista")
  );
  const imagenPortadaRef = useRef(null); // la animación de entrada se coloca justo encima de esta imagen

  // 🔐 cuenta y estado de acceso ("cargando" | "sin-cuenta" | "pendiente" | "aprobada")
  const [avisoExpulsion, setAvisoExpulsion] = useState(false);
  const { usuario, estado: estadoAcceso } = useAcceso(() => {
    setAvisoExpulsion(true);
    setPantalla("ajustes");
  });
  const aprobada = estadoAcceso === "aprobada";
  // ☁️ el progreso se guarda en la nube, vinculado a la cuenta
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeSync, setMensajeSync] = useState("");

  // 🏁 abrir la carrera directamente en el modo online (desde el buzón o un reto)
  const [carreraOnline, setCarreraOnline] = useState(false);
  function abrirCarreraOnline() {
    setCarreraOnline(true);
    setPantalla("carrera");
  }

  function datosLocales() {
    return {
      stats: obtenerStats(),
      racha: obtenerRacha(),
      tiempos: obtenerTiempos(),
      favoritos: obtenerFavoritos(),
      erre: obtenerNivelesErre(),
      actualizado: new Date().toISOString()
    };
  }

  function aplicarDatos(datos) {
    if (datos.stats) guardarStats(datos.stats);
    if (datos.racha) localStorage.setItem(CLAVE_RACHA, JSON.stringify(datos.racha));
    if (datos.tiempos) localStorage.setItem(CLAVE_TIEMPOS, JSON.stringify(datos.tiempos));
    if (datos.favoritos) guardarFavoritos(datos.favoritos);
    if (datos.erre) guardarNivelesErre(datos.erre, false); // copiar desde la nube no cuenta como ficha hecha hoy
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
        await setDoc(doc(db, "progreso", u.uid), datosLocales());
      }
    } catch (e) {
      setMensajeSync("⚠️ No se pudo conectar. Comprueba tu conexión a internet.");
    }
    setSincronizando(false);
  }


  // 📦 preguntas desde Firestore: banco completo si la cuenta está aprobada, demo si no
  useEffect(() => {
    if (estadoAcceso === "cargando") return;
    let cancelado = false;
    leerBanco(estadoAcceso === "aprobada")
      .then((datos) => {
        if (!cancelado) setPreguntasBase(datos);
      })
      .catch((error) => {
        console.error("Error al cargar las preguntas:", error);
        if (!cancelado) setPreguntasBase([]);
      });
    return () => {
      cancelado = true;
    };
  }, [estadoAcceso]);

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

  // ⬅ volver a una de las pantallas principales (guardando el progreso en la nube)
  function volverA(destino) {
    setPantalla(destino);
    sincronizarConNube();
  }

  // 🧭 visita guiada: sale sola la primera vez que se llega a Inicio
  const [pasoGuia, setPasoGuia] = useState(null);
  useEffect(() => {
    if (pantalla !== "inicio" || pasoGuia !== null) return;
    try {
      if (!localStorage.getItem(CLAVE_VISITA)) setPasoGuia(0);
    } catch {}
  }, [pantalla]); // eslint-disable-line react-hooks/exhaustive-deps

  function terminarGuia() {
    try {
      localStorage.setItem(CLAVE_VISITA, "1");
    } catch {}
    setPasoGuia(null);
    setPantalla("inicio");
  }

  // 🗓️ calendario de la cuenta (para "Hoy toca…", la ración y la semana)
  const calendario = useCalendario(aprobada ? usuario : null);

  // ✍️ letra manuscrita de los títulos (Caveat), una sola vez
  useEffect(() => {
    if (document.getElementById("fuente-caveat")) return;
    const enlace = document.createElement("link");
    enlace.id = "fuente-caveat";
    enlace.rel = "stylesheet";
    enlace.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap";
    document.head.appendChild(enlace);
  }, []);

  // al cambiar de pantalla, empezar arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pantalla]);

// 🏠 el botón de pánico (definido en index.html) se oculta en la Portada y en las
// pantallas con barra: solo aparece dentro de una tarea (test, juego, examen…)
useEffect(() => {
  const boton = document.getElementById("boton-panico");
  if (boton) {
    // (en Explora tampoco: el propio Explorador la esconde para no romper la inmersión)
    const ocultarEn = pantalla === "landing" || pantalla === "explora" || PANTALLAS_CON_BARRA.includes(pantalla);
    boton.style.display = ocultarEn ? "none" : "block";
  }
}, [pantalla]);

// al salir de la carrera, la próxima vez vuelve a abrirse por su portada
useEffect(() => {
  if (pantalla !== "carrera") setCarreraOnline(false);
}, [pantalla]);

  // 🔐 sin aprobación solo se ven las preguntas marcadas como demo en el Sheet
  const preguntasVisibles = useMemo(() => {
    if (aprobada) return preguntasBase;
    const grupoDemo = preguntasBase.filter((p) => p.demo);
    return [...grupoDemo].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [preguntasBase, aprobada]);

  // 🔐 pantallas que solo pueden usar las cuentas aprobadas
  const PANTALLAS_BLOQUEADAS = ["simulacro", "carrera", "muerte", "archivos", "calendario", "compis", "tarjetero"];

  // 🔒 aspecto de las tarjetas bloqueadas (no se aplica mientras se comprueba la cuenta)
  const mostrarBloqueo = !aprobada && estadoAcceso !== "cargando";
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
          ref={imagenPortadaRef}
          src={portada}
          alt="Insistentes Sociales"
          style={styles.landingImage}
        />

<style>{"@keyframes aparecerPortada { from { opacity: 0; } to { opacity: 1; } }"}</style>
        <div
          key={verIntro ? "esperando" : "visible"}
          style={{
            ...styles.landingOverlay,
            ...(verIntro ? { opacity: 0 } : { animation: "aparecerPortada 1s ease 0.15s both" })
          }}
        >
          <p style={styles.landingFrase}>"{frase}"</p>

          <button
            onClick={() => setPantalla("inicio")}
            style={styles.landingButton}
          >
            Empezar a estudiar
          </button>
        </div>

        {verIntro && (
          <IntroAnimada
          imagenRef={imagenPortadaRef}
          onFin={() => {
              sessionStorage.setItem("opo_intro_vista", "1");
              setVerIntro(false);
            }}
          />
        )}
      </div>
    );
  }

// 🧭 pantallas principales: fondo de papel, contenido y barra inferior
function conBarra(contenido) {
  return conPersonaje(
    <div style={{ ...FONDO_PAPEL, minHeight: "100vh", width: "100%" }}>
      <style>{cssHub}</style>
      <div style={PAGINA}>{contenido}</div>
      <BarraInferior activa={pantalla} irA={setPantalla} />
      {pasoGuia !== null && (
        <GuiaVisita paso={pasoGuia} setPaso={setPasoGuia} pantalla={pantalla} irA={setPantalla} onFin={terminarGuia} />
      )}
    </div>
  );
}

// 🟣 INICIO
if (pantalla === "inicio") {
  return conBarra(
    <>
      <InicioHoy
        usuario={aprobada ? usuario : null}
        preguntas={preguntasVisibles}
        bloquesDe={preguntasBase}
        calendario={calendario}
        irA={setPantalla}
        buzon={aprobada && usuario ? <Buzon usuario={usuario} irACarrera={abrirCarreraOnline} /> : null}
      />

    </>
  );
}

// 📖 ESTUDIAR: memorizar la ley
if (pantalla === "estudiar") {
  const c = COLOR_SECCION.estudiar;
  return conBarra(
    <>
      <TituloHub titulo="Estudiar" subtitulo="Diferentes formas de estudiar el temario" color={c.linea} />
      <Rejilla>
        <Tile
          icono={iconoExplora}
          guia="explora"
          nombre="Explora la Constitución"
          texto="Recorre sus salas y abre cada artículo"
          fondo={c.fondo}
          linea={c.linea}
          ancho={2}
          alto={120}
          onClick={() => setPantalla("explora")}
        />
        <Tile
          icono={iconoErre}
          guia="erre"
          nombre="Erre que erre"
          texto="Escribe un artículo de memoria"
          fondo={c.fondoClaro}
          linea={c.linea}
          onClick={() => setPantalla("erre")}
        />
        <Tile
          icono={iconoHubConstruyeConstitucion}
          guia="construye"
          nombre="Construye"
          texto="Coloca cada parte en su sitio"
          fondo={c.fondo}
          linea={c.linea}
          onClick={() => setPantalla("construye")}
        />
        <Tile
          icono={iconoHubConectaConstitucion}
          guia="conecta"
          nombre="Conecta"
          texto="Une cada artículo con lo que dice"
          fondo={c.fondo}
          linea={c.linea}
          bloqueado={mostrarBloqueo}
          onClick={() => setPantalla("archivos")}
        />
        <Tile
          icono={iconoTarjetero}
          guia="tarjetero"
          nombre="Tarjetero"
          texto="Tus resúmenes en carpetas"
          fondo={c.fondoClaro}
          linea={c.linea}
          bloqueado={mostrarBloqueo}
          onClick={() => setPantalla("tarjetero")}
        />
      </Rejilla>
    </>
  );
}

// 📝 TEST: preguntas como las del examen
if (pantalla === "test") {
  const c = COLOR_SECCION.test;
  const { prioritarios, seguimiento } = clasificarErrores(preguntasVisibles);
  const pendientes = prioritarios.length + seguimiento.length;
  const favoritas = obtenerFavoritos().length;
  return conBarra(
    <>
      <TituloHub titulo="Test" subtitulo="Practica con preguntas como las del examen" color={c.linea} />
      <Rejilla>
        <Tile
          icono={iconoRepaso}
          guia="repaso"
          escalaIcono={1.3}
          nombre="Repaso"
          texto="Por bloques o general, a tu ritmo"
          fondo={c.fondo}
          linea={c.linea}
          alto={180}
          onClick={() => setPantalla("estudiar-estudio")}
        />
        <Tile
          icono={iconoReloj}
          guia="simulacro"
          nombre="Simulacro oficial"
          texto="Examen completo de 100 preguntas"
          fondo={c.fondo}
          linea={c.linea}
          alto={180}
          bloqueado={mostrarBloqueo}
          onClick={() => setPantalla("simulacro")}
        />
      </Rejilla>
      <SubtituloMano>Para reforzar</SubtituloMano>
      <Rejilla>
        <Tile
          icono={iconoRepasarErrores}
          guia="errores"
          tamIcono={92}
          escalaIcono={1.45}
          nombre="Repasar errores"
          texto="Las que has fallado"
          etiqueta={pendientes > 0 ? `${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"}` : null}
          fondo={c.fondoClaro}
          linea={c.linea}
          alto={140}
          onClick={() => setPantalla("estudiar-errores")}
        />
        <Tile
          icono={iconoFavoritas}
          guia="favoritas"
          nombre="Favoritas"
          texto="Las que has guardado"
          etiqueta={favoritas > 0 ? `${favoritas} ${favoritas === 1 ? "guardada" : "guardadas"}` : null}
          fondo={c.fondoClaro}
          linea={c.linea}
          alto={140}
          onClick={() => setPantalla("estudiar-favoritos")}
        />
      </Rejilla>
    </>
  );
}

// 🎮 JUEGOS
if (pantalla === "minijuegos") {
  const c = COLOR_SECCION.juegos;
  return conBarra(
    <>
      <TituloHub titulo="Juegos" subtitulo="Repasa jugando: compite o aguanta la presión" color={c.linea} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Tile
          icono={iconoHubCarreraPlaza}
          guia="carrera"
          nombre="Carrera por la Plaza"
          texto="Compite con tus compis y llega antes a la meta"
          fondo={c.fondo}
          linea={c.linea}
          ancho={2}
          alto={130}
          bloqueado={mostrarBloqueo}
          onClick={() => setPantalla("carrera")}
        />
        <Tile
          icono={iconoHubSalvaTrabajadora}
          guia="salva"
          nombre="Salva a tu trabajadora social"
          texto="Responde rápido antes de que se le caiga todo encima"
          fondo={c.fondoClaro}
          linea={c.linea}
          ancho={2}
          alto={130}
          bloqueado={mostrarBloqueo}
          onClick={() => setPantalla("muerte")}
        />
      </div>
    </>
  );
}

// 🗂️ MI EXPEDIENTE
if (pantalla === "expediente") {
  return conBarra(
    <MiExpediente
      usuario={usuario}
      aprobada={aprobada}
      mostrarBloqueo={mostrarBloqueo}
      calendario={calendario}
      irA={setPantalla}
      verInstrucciones={() => {
        setPantalla("inicio");
        setPasoGuia(0);
      }}
    />
  );
}

// 🗓️ MI CALENDARIO
if (pantalla === "calendario") {
  return conPersonaje(
    <MiCalendario volverMenu={() => volverA("expediente")} irAPerfil={() => setPantalla("ajustes")} />
  );
}

// ☠️ DETALLE DE "SALVA A TU TRABAJADORA SOCIAL"
if (pantalla === "muerte") {
    return (
      <SalvaTrabajadoraSocial
        preguntasBase={preguntasBase}
        setPantalla={setPantalla}
        volverMenu={() => volverA("minijuegos")}
      />
    );
  }

  // 📖 TEST → REPASO (por bloques o general)
  if (pantalla === "estudiar-estudio") {
    return conPersonaje(
      <Estudiar
        key={pantalla}
        preguntasBase={preguntasVisibles}
        volverMenu={() => volverA("test")}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="config"
      />
    );
  }

  // 🗂️ TEST → REPASAR ERRORES
  if (pantalla === "estudiar-errores") {
    return conPersonaje(
      <Estudiar
        key={pantalla}
        preguntasBase={preguntasVisibles}
        volverMenu={() => volverA("test")}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="errores"
      />
    );
  }

  // ❤️ TEST → FAVORITAS
  if (pantalla === "estudiar-favoritos") {
    return conPersonaje(
      <Estudiar
        key={pantalla}
        preguntasBase={preguntasVisibles}
        volverMenu={() => volverA("test")}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="favoritos"
      />
    );
  }

  // 📈 MI EXPEDIENTE → EVOLUCIÓN (solo estadísticas)
  if (pantalla === "estudiar-progreso") {
    return conPersonaje(
      <Estudiar
        key={pantalla}
        preguntasBase={preguntasVisibles}
        volverMenu={() => volverA("expediente")}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="estadisticas"
      />
    );
  }

  // 📝 SIMULACRO OFICIAL
  if (pantalla === "simulacro") {
    return <Simulacro preguntasBase={preguntasBase} volverMenu={() => volverA("test")} />;
  }

  // 🏁 CARRERA POR LA PLAZA
  if (pantalla === "carrera") {
    return (
      <CarreraPlaza
        preguntasBase={preguntasBase}
        setPantalla={setPantalla}
        volverMenu={() => volverA("minijuegos")}
        vistaInicial={carreraOnline ? "online" : "detalle"}
      />
    );
  }

  // 🏛️ CONSTRUYE LA CONSTITUCIÓN (y Explora, que vive dentro)
  if (pantalla === "construye" || pantalla === "explora") {
    return (
      <ConstruyeConstitucion
        key={pantalla}
        setPantalla={setPantalla}
        volver={() => volverA("estudiar")}
        vistaInicial={pantalla === "explora" ? "explorar" : "detalle"}
      />
    );
  }

  // 🔁 ERRE QUE ERRE (te propone el artículo que menos dominas)
  if (pantalla === "erre") {
    return conPersonaje(
      <ErreDelDia volver={() => volverA("estudiar")} irAExplorar={() => setPantalla("explora")} />
    );
  }

  // 📁 CONECTA LA CONSTITUCIÓN (al salir, vuelve a Estudiar)
  if (pantalla === "archivos") {
    return conPersonaje(
      <ConectaConstitucion
        setPantalla={(p) => setPantalla(p === "minijuegos" || p === "inicio" ? "estudiar" : p)}
        volverMenu={() => volverA("estudiar")}
      />
    );
  }

  // 💌 MIS COMPIS
  if (pantalla === "compis") {
    return conPersonaje(
      <MisCompis
        usuario={usuario}
        volver={() => setPantalla("expediente")}
        irACarrera={abrirCarreraOnline}
        irAPerfil={() => setPantalla("ajustes")}
      />
    );
  }

  // 🗂️ MI TARJETERO (cada cuenta el suyo)
  if (pantalla === "tarjetero") {
    return conPersonaje(<Tarjetero volver={() => setPantalla("expediente")} />);
  }

  // ⚖️ MIS IMPUGNACIONES
  if (pantalla === "impugnaciones") {
    return conPersonaje(
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Impugnaciones</h1>
          <div style={styles.menuUnderline} />
        </div>
        <MisImpugnaciones />
        <button onClick={() => setPantalla("expediente")} style={styles.linkVolver}>
          ⬅ Volver a Mi expediente
        </button>
      </div>
    );
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

        {avisoExpulsion && (
          <div style={{ ...styles.configCard, background: "#f9e3e3" }}>
            <p style={styles.configCardTitle}>Se ha cerrado tu sesión</p>
            <p style={styles.configSubLabel}>
              Has iniciado sesión en otro dispositivo. Cada cuenta solo puede estar
              abierta en un dispositivo a la vez. Si quieres seguir aquí, vuelve a entrar.
            </p>
            <button onClick={() => setAvisoExpulsion(false)} style={styles.linkVolver}>
              Entendido
            </button>
          </div>
        )}

<CuentaUsuario usuario={usuario} estadoAcceso={estadoAcceso} />

{usuario && aprobada && <MiIdentidad usuario={usuario} />}


        <div style={styles.perfilNotaCard}>
          <span style={{ fontSize: 22 }}>🌸</span>
          <p style={{ margin: 0 }}>
            Tu progreso es importante. Guárdalo y nunca perderás lo que has conseguido. 💗
          </p>
        </div>

        <button onClick={() => volverA("expediente")} style={styles.linkVolver}>
          ⬅ Volver a Mi expediente
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