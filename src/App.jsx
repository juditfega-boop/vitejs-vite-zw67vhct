import { useEffect, useState } from "react";
import { cargarPreguntas } from "./cargarPreguntas";
import portada from "./assets/portada.jpeg";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import miniaturaArchivos from "./assets/archivos-miniatura.png";
import miniaturaConstruye from "./assets/construye-miniatura.png";
import miniaturaCarreraPlaza from "./assets/carrera-miniatura.jpg";
import { globalStyles, styles } from "./estilos";
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
import iconoTaza from "./assets/kit/icono-taza-perfil.png";
import iconoPlantita from "./assets/kit/icono-plantita-evolucion.png";
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
  const pendientesEstudio = Math.max(0, preguntasBase.length - Object.keys(statsInicio).length);

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

  return (
    <div style={styles.menuContainer}>
      <div style={styles.inicioHeader}>
        <img src={casaIcono} alt="" style={styles.inicioCasaIcono} />
        <span style={styles.inicioHeaderTexto}>Inicio</span>
      </div>

      <div style={styles.inicioHeroCard}>
        <img src={iconoPlantita} alt="" style={styles.inicioHeroIcono} />
        <div style={styles.inicioHeroTexto}>
          <p style={styles.inicioHeroTitulo}>
            🔥 ¡Llevas {racha} {racha === 1 ? "día" : "días"} seguidos!
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
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaRosa }}
        >
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
          onClick={() => setPantalla("desarrollo")}
          style={{ ...styles.inicioTarjeta, ...styles.inicioTarjetaMuted }}
        >
          <img src={iconoCarpeta} alt="" style={styles.inicioTarjetaIcono} />
          <p style={styles.inicioTarjetaTitulo}>Desarrollo</p>
          <p style={styles.inicioTarjetaSubtitulo}>Próximamente</p>
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
      destino: "construye"
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

// DESARROLLO (próximamente)
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
    return (
      <Estudiar
        preguntasBase={preguntasBase}
        volverMenu={volverMenu}
        sincronizarConNube={sincronizarConNube}
        vistaInicial="config"
      />
    );
  }

  // 📈 MI EVOLUCIÓN
  if (pantalla === "estudiar-progreso") {
    return (
      <Estudiar
        preguntasBase={preguntasBase}
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
    return <ConectaConstitucion setPantalla={setPantalla} volverMenu={volverMenu} />;
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

  return (
    <div style={styles.menuContainer}>
      <p style={styles.configSubLabel}>Pantalla no encontrada.</p>
      <button onClick={volverMenu} style={styles.linkVolver}>
        ⬅ Volver al menú
      </button>
    </div>
  );
}