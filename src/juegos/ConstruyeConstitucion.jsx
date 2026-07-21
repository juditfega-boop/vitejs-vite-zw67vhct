import { useState, useEffect } from "react";
import { ESTRUCTURA_CONSTITUCION } from "../construyeConstitucion";
import { MENSAJES_ANDER_EGG } from "../data/anderEggMensajes";
import construyeTecho from "../assets/construye-techo.png";
import construyePlantaBaja from "../assets/construye-plantabaja.png";
import construyeArchivero from "../assets/construye-archivero.png";
import { styles, globalStyles } from "../estilos";
import iconoLadrillo from "../assets/bookbrand/icono-brand-ladrillo.png";
import iconoGrua from "../assets/bookbrand/icono-brand-grua.png";
import heroConstruyeConstitucion from "../assets/kit/hero-construye-constitucion.png";
import LawExplorer from "../explorador/LawExplorer";
import imagenesExplorador from "../explorador/imagenesRegistry";
import SalaCapitulo from "../explorador/skins/edificio/SalaCapitulo";
import PlaceholderNivel from "../explorador/skins/edificio/PlaceholderNivel";
import DetalleArticulo from "../explorador/skins/edificio/DetalleArticulo";
import dataConstitucion from "../explorador/data/constitucion.json";

const edificioSkinPrueba = {
  titulos: SalaCapitulo,
  capitulos: SalaCapitulo,
  secciones: SalaCapitulo,
  articulos: SalaCapitulo,
  leaf: DetalleArticulo,
};

function tituloI() {
  return dataConstitucion.children.find((t) => t.id === "titulo-1");
}

// 🔀 mezcla un array al azar (copia local, igual que la de App.jsx)
function mezclar(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// 🔍 frases de feedback al pulsar "Comprobar" (el corrector hablando, no Ezequiel)
const FRASES_COMPROBAR_PARCIAL = [
  "Casi... revisa uno de los dos números.",
  "Vas bien, pero algo no cuadra del todo.",
  "Un número está bien, el otro no."
];
const FRASES_COMPROBAR_INCORRECTO = [
  "No es correcto, vuelve a intentarlo.",
  "Ese expediente no encaja ahí todavía.",
  "Prueba con otros números."
];

// 🏛️ "Construye la Constitución" — componente independiente y autocontenido.
// Recibe por prop solo lo que necesita para volver al hub de minijuegos.
export default function ConstruyeConstitucion({ setPantalla }) {
  const [vista, setVista] = useState("detalle"); // "detalle" | "config" | "jugando"

  // Oculta la casita de navegación global mientras se explora el edificio,
  // para no romper la inmersión — se restaura al salir de esta pantalla.
  useEffect(() => {
    const boton = document.getElementById('boton-panico');
    if (!boton) return;
    boton.style.display = vista === 'explorar' ? 'none' : '';
    return () => {
      boton.style.display = '';
    };
  }, [vista]);

  // 🖐️ posición arrastrable del botón de Ezequiel
  const [archiveroPos, setArchiveroPos] = useState(() => ({
    x: window.innerWidth - 80,
    y: window.innerHeight - 150
  }));
  const arrastrandoRef = useState({ current: false })[0];
  const offsetRef = useState({ current: { x: 0, y: 0 } })[0];
  const seMovioRef = useState({ current: false })[0];

  function iniciarArrastreArchivero(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastrandoRef.current = true;
    seMovioRef.current = false;
    offsetRef.current = {
      x: e.clientX - archiveroPos.x,
      y: e.clientY - archiveroPos.y
    };
  }

  function moverArchivero(e) {
    if (!arrastrandoRef.current) return;
    seMovioRef.current = true;

    const nuevoX = Math.min(
      Math.max(10, e.clientX - offsetRef.current.x),
      window.innerWidth - 70
    );
    const nuevoY = Math.min(
      Math.max(10, e.clientY - offsetRef.current.y),
      window.innerHeight - 70
    );

    setArchiveroPos({ x: nuevoX, y: nuevoY });
  }

  function soltarArchivero() {
    arrastrandoRef.current = false;
  }

  const [construyeAmbito, setConstruyeAmbito] = useState([]);
  const [construyeRespuestas, setConstruyeRespuestas] = useState({});
  const [construyeResultados, setConstruyeResultados] = useState({});
  const [construyeCompleto, setConstruyeCompleto] = useState(false);
  const [construyeFeedback, setConstruyeFeedback] = useState({});
  const [construyeIntentos, setConstruyeIntentos] = useState({});
  const [construyeMensajesPool, setConstruyeMensajesPool] = useState([]);
  const [construyeMensajeActual, setConstruyeMensajeActual] = useState("");
  const [construyePistaOferta, setConstruyePistaOferta] = useState(null);
  const [construyeDeclinado, setConstruyeDeclinado] = useState({});
  const [archiveroAbierto, setArchiveroAbierto] = useState(false);

  function iniciarConstruye(ambito) {
    setConstruyeAmbito(ambito);
    setConstruyeRespuestas({});
    setConstruyeResultados({});
    setConstruyeCompleto(false);
    setConstruyeFeedback({});
    setConstruyeIntentos({});
    setConstruyeMensajesPool([]);
    setConstruyeMensajeActual(
      "¡Hola! Soy Ezequiel Ander-Egg. Me puedes mover a donde quieras, y cada vez que me pinches te contaré algo distinto sobre mí."
    );
    setConstruyePistaOferta(null);
    setConstruyeDeclinado({});
    setArchiveroAbierto(true);
    setVista("jugando");
  }

  function actualizarRespuestaConstruye(id, campo, valor) {
    setConstruyeRespuestas((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor }
    }));
  }

  function comprobarConstruye() {
    const resultados = {};
    const nuevosIntentos = { ...construyeIntentos };
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

      if (estado === "correcto") {
        nuevosIntentos[item.id] = 0;
      } else {
        nuevosIntentos[item.id] = (nuevosIntentos[item.id] || 0) + 1;
      }
    });

    const feedback = {};
    construyeAmbito.forEach((item) => {
      const estado = resultados[item.id];
      if (estado === "parcial") {
        feedback[item.id] =
          FRASES_COMPROBAR_PARCIAL[Math.floor(Math.random() * FRASES_COMPROBAR_PARCIAL.length)];
      } else if (estado === "incorrecto") {
        feedback[item.id] =
          FRASES_COMPROBAR_INCORRECTO[Math.floor(Math.random() * FRASES_COMPROBAR_INCORRECTO.length)];
      }
    });

    setConstruyeResultados(resultados);
    setConstruyeFeedback(feedback);
    setConstruyeIntentos(nuevosIntentos);
    setConstruyeCompleto(todoCorrecto);

    setConstruyeDeclinado((prev) => {
      const copia = { ...prev };
      Object.keys(nuevosIntentos).forEach((id) => {
        if (resultados[id] !== "correcto") copia[id] = false;
      });
      return copia;
    });

    const apartadoDificil = construyeAmbito.find(
      (item) =>
        (nuevosIntentos[item.id] || 0) >= 3 && resultados[item.id] !== "correcto"
    );

    if (apartadoDificil) {
      setConstruyePistaOferta(apartadoDificil.id);
      setArchiveroAbierto(true);
    }
  }

  function mostrarSiguienteMensajeArchivero() {
    let pool = construyeMensajesPool;
    if (pool.length === 0) {
      pool = mezclar(MENSAJES_ANDER_EGG);
    }
    const [siguiente, ...resto] = pool;
    setConstruyeMensajeActual(siguiente.texto);
    setConstruyeMensajesPool(resto);
  }

  function abrirArchivero() {
    if (archiveroAbierto) {
      setArchiveroAbierto(false);
      return;
    }

    const apartadoDificil = construyeAmbito.find(
      (item) =>
        (construyeIntentos[item.id] || 0) >= 3 &&
        construyeResultados[item.id] !== "correcto" &&
        !construyeDeclinado[item.id]
    );

    if (apartadoDificil) {
      setConstruyePistaOferta(apartadoDificil.id);
    } else {
      setConstruyePistaOferta(null);
      mostrarSiguienteMensajeArchivero();
    }

    setArchiveroAbierto(true);
  }

  function aceptarPistaArchivero(apartadoId) {
    const item = construyeAmbito.find((i) => i.id === apartadoId);

    if (item) {
      const respuesta = construyeRespuestas[item.id] || {};
      const inicioOk = Number(respuesta.inicio) === item.inicio;
      const finOk = Number(respuesta.fin) === item.fin;

      let texto;
      if (!finOk && inicioOk) {
        texto = `Este apartado termina justo antes del artículo ${item.fin + 1}.`;
      } else if (item.inicio === 1) {
        texto = "Este apartado empieza justo en el artículo 1.";
      } else {
        texto = `Este apartado empieza después del artículo ${item.inicio - 1}.`;
      }

      setConstruyeMensajeActual(texto);
    }

    setConstruyePistaOferta(null);
  }

  function declinarPistaArchivero(apartadoId) {
    setConstruyeDeclinado((prev) => ({ ...prev, [apartadoId]: true }));
    setConstruyePistaOferta(null);
    mostrarSiguienteMensajeArchivero();
  }

// 🏛️ DETALLE
if (vista === "detalle") {
  return (
    <div style={styles.menuContainer}>
      <div style={styles.quizHeaderRow}>
        <button onClick={() => setPantalla("minijuegos")} style={styles.quizVolverBtn}>
          ⬅
        </button>
      </div>

      <div style={styles.menuHeader}>
        <span style={styles.juegoDetalleEmojiTitulo}>🏛️</span>
        <h1 style={styles.menuTitle}>Construye la Constitución</h1>
        <div style={styles.menuUnderline} />
      </div>

      <img src={heroConstruyeConstitucion} alt="" style={styles.juegoDetalleHeroImg} />

      <div style={styles.configCard}>
          <div style={styles.juegoDetalleFila}>
            <img src={iconoLadrillo} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>
              La Constitución se ha desmontado
            </p>
          </div>
          <div style={styles.juegoDetalleFila}>
            <img src={iconoGrua} alt="" style={styles.juegoDetalleIcono} />
            <p style={styles.juegoDetalleTexto}>
              Vuelve a construirla, planta a planta
            </p>
          </div>
          <div style={{ ...styles.juegoDetalleFila, borderBottom: "none" }}>
            <span style={styles.juegoDetalleEmoji}>🔢</span>
            <p style={styles.juegoDetalleTexto}>
              Completa el artículo inicial y final de cada título, capítulo y sección
            </p>
          </div>
        </div>

        <button onClick={() => setVista("config")} style={styles.ctaButton}>
        🚩 Construir
      </button>

      <button onClick={() => setVista("explorar")} style={styles.linkVolver}>
        🔍 Explorar Constitución
      </button>

      <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
        🍃 Volver
      </button>
    </div>
  );
}

if (vista === "explorar") {
  return (
    <div style={{ ...styles.menuContainer, padding: 0, maxWidth: "100%" }}>
      <button onClick={() => setVista("detalle")} style={styles.linkVolver}>
        ⬅ Volver
      </button>
      <LawExplorer
          data={dataConstitucion}
          skin={edificioSkinPrueba}
        getNodeState={() => null}
        onLeafAction={(nodo) => console.log("practicar", nodo.id)}
      />
    </div>
  );
}

// 🏛️ ELEGIR QUÉ CONSTRUIR
if (vista === "config") {
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

        <button onClick={() => setVista("detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 🏛️ EN CURSO (dentro del propio edificio)
  if (vista === "jugando") {
    const paletaFloors = ["#c9e4d0", "#f6d7ae", "#f3cdd2", "#cbe0ea"];

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

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

                  {construyeFeedback[item.id] && (
                    <p style={styles.construyeFeedbackTexto}>{construyeFeedback[item.id]}</p>
                  )}
                </div>
              );
            })}
          </div>

          <img src={construyePlantaBaja} alt="" style={styles.edificioPlantaBajaImg} />
        </div>

        <button onClick={comprobarConstruye} style={styles.ctaButton}>
          Comprobar
        </button>

        <div
          style={{
            position: "fixed",
            left: archiveroPos.x,
            top: archiveroPos.y,
            zIndex: 50
          }}
        >
          <button
            onPointerDown={iniciarArrastreArchivero}
            onPointerMove={moverArchivero}
            onPointerUp={soltarArchivero}
            onClick={() => {
              if (!seMovioRef.current) abrirArchivero();
            }}
            style={{
              ...styles.archiveroBotonFlotante,
              position: "relative",
              touchAction: "none"
            }}
          >
            <img src={construyeArchivero} alt="Ezequiel, el Archivero" style={styles.archiveroFotoFlotante} />
          </button>

          {archiveroAbierto && (
            <div
              style={{
                ...styles.archiveroGloboFlotante,
                ...(archiveroPos.y > window.innerHeight / 2
                  ? { bottom: 70, top: "auto" }
                  : { top: 70, bottom: "auto" }),
                ...(archiveroPos.x > window.innerWidth / 2
                  ? { right: 0, left: "auto" }
                  : { left: 0, right: "auto" })
              }}
            >
            {construyePistaOferta ? (
              <>
                <p style={{ margin: "0 0 10px" }}>
                  Parece que esta planta se está resistiendo... ¿Quieres una pista?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => aceptarPistaArchivero(construyePistaOferta)}
                    style={styles.archiveroBotonSi}
                  >
                    Sí, dame una pista
                  </button>
                  <button
                    onClick={() => declinarPistaArchivero(construyePistaOferta)}
                    style={styles.archiveroBotonNo}
                  >
                    Prefiero seguir intentando
                  </button>
                </div>
              </>
) : (
  <p style={{ margin: 0 }}>{construyeMensajeActual}</p>
)}
</div>
)}
</div>

        <button onClick={() => setVista("config")} style={styles.linkVolver}>
          ⬅ Elegir otra vez qué construir
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver a minijuegos
        </button>
      </div>
    );
  }

  return null;
}