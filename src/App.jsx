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
    const racha = obtenerRacha().racha;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Menú principal</h1>
          <div style={styles.menuUnderline} />
        </div>

        <p style={{ textAlign: "center", color: "#7a9a7a", fontSize: 13, marginTop: -10, marginBottom: 24 }}>
          🌿 Racha actual: {racha} {racha === 1 ? "día" : "días"}
        </p>

        <button
          className="menu-btn"
          onClick={() => setPantalla("estudiar-estudio")}
          style={{ ...styles.menuButton, ...styles.btnPeach }}
        >
          📖 Estudiar
        </button>

        <button
          className="menu-btn"
          onClick={() => setPantalla("simulacro")}
          style={{ ...styles.menuButton, ...styles.btnPurple }}
        >
          📝 Simulacro oficial
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
          onClick={() => setPantalla("desarrollo")}
          style={{ ...styles.menuButton, ...styles.btnMuted }}
        >
          🧩 Desarrollo <span style={styles.badgeProximamente}>Próximamente</span>
        </button>

        <div style={{ height: 1, background: "#e4ddcf", margin: "18px 4px" }} />

        <button
          className="menu-btn"
          onClick={() => setPantalla("estudiar-progreso")}
          style={{ ...styles.menuButton, ...styles.btnPink }}
        >
          📈 Mi evolución
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