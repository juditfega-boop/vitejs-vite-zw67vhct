import { useState, useRef, useEffect } from "react";
import { styles } from "../estilos";
import registroPersonajes from "./registroPersonajes";
import mensajesPorPersonaje from "./mensajesPorPersonaje";
import { obtenerPersonajeActivo } from "./personajeActivo";

function mezclar(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

/**
 * Burbuja flotante y arrastrable del personaje activo. Genérica: cada juego
 * la monta sin saber qué personaje hay elegido. Si el juego necesita que el
 * personaje diga algo concreto (ej. ofrecer una pista), le pasa
 * `mensajeContextual` — si no, el personaje charla con su pool de frases.
 */
export default function PersonajeFlotante({ mensajeContextual }) {
  const personajeId = obtenerPersonajeActivo();
  const personaje = registroPersonajes[personajeId] || registroPersonajes["ander-egg"];
  const poolBase = mensajesPorPersonaje[personajeId] || [];

  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 80,
    y: window.innerHeight - 150
  }));
  const [abierto, setAbierto] = useState(false);
  const [mensajeActual, setMensajeActual] = useState(personaje.mensajeBienvenida);

  const poolRef = useRef([]);
  const arrastrandoRef = useRef(false);
  const seMovioRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  function iniciarArrastre(e) {
    arrastrandoRef.current = true;
    seMovioRef.current = false;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }

  // Escucha en window (no solo en el botón) — más robusto que
  // setPointerCapture dentro de un iframe con sandbox como StackBlitz.
  useEffect(() => {
    function mover(e) {
      if (!arrastrandoRef.current) return;
      seMovioRef.current = true;
      const nuevoX = Math.min(Math.max(10, e.clientX - offsetRef.current.x), window.innerWidth - 70);
      const nuevoY = Math.min(Math.max(10, e.clientY - offsetRef.current.y), window.innerHeight - 70);
      setPos({ x: nuevoX, y: nuevoY });
    }
    function soltar() {
      arrastrandoRef.current = false;
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, []);

  function siguienteMensajeFlavor() {
    let pool = poolRef.current;
    if (pool.length === 0) pool = mezclar(poolBase);
    const [siguiente, ...resto] = pool;
    poolRef.current = resto;
    setMensajeActual(siguiente ? siguiente.texto : personaje.mensajeBienvenida);
  }

  function alPulsar() {
    if (seMovioRef.current) return; // fue arrastre, no un toque
    if (abierto) {
      setAbierto(false);
      return;
    }
    if (!mensajeContextual) {
      siguienteMensajeFlavor();
    }
    setAbierto(true);
  }

  return (
    <div style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 50 }}>
      <button
        onPointerDown={iniciarArrastre}
        onClick={alPulsar}
        style={{ ...styles.archiveroBotonFlotante, position: "relative", touchAction: "none" }}
      >
        <img src={personaje.foto} alt={personaje.nombre} style={styles.archiveroFotoFlotante} />
      </button>

      {abierto && (
        <div
          style={{
            ...styles.archiveroGloboFlotante,
            ...(pos.y > window.innerHeight / 2 ? { bottom: 70, top: "auto" } : { top: 70, bottom: "auto" }),
            ...(pos.x > window.innerWidth / 2 ? { right: 0, left: "auto" } : { left: 0, right: "auto" })
          }}
        >
          {mensajeContextual ? (
            <>
              <p style={{ margin: mensajeContextual.botones ? "0 0 10px" : 0 }}>{mensajeContextual.texto}</p>
              {mensajeContextual.botones && (
                <div style={{ display: "flex", gap: 8 }}>
                  {mensajeContextual.botones.map((b, i) => (
                    <button key={i} onClick={b.onClick} style={i === 0 ? styles.archiveroBotonSi : styles.archiveroBotonNo}>
                      {b.texto}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ margin: 0 }}>{mensajeActual}</p>
          )}
        </div>
      )}
    </div>
  );
}