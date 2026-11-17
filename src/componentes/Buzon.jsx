import { useEffect, useRef, useState } from "react";
import {
  vigilarBuzon,
  marcarLeidos,
  borrarAviso,
  marcarAvisoProcesado,
  anadirCompis,
  CLAVE_NOMBRE_APP,
  CLAVE_SALA_CARRERA
} from "../servicios/compis";
import { unirseSala } from "../servicios/salas";
import { HECHIZOS, estHechizos, cssHechizos, haceCuanto } from "./hechizos";
import iconoSobre from "../assets/kit/icono-buzon-sobre.png";
import iconoReto from "../assets/kit/hechizo-reto-carrera.png";

const est = {
  tarjeta: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #ece2f1",
    borderRadius: 24,
    padding: "12px 18px 12px 12px",
    marginBottom: 20,
    background: "linear-gradient(135deg, #f3ecf8, #f8ecee)",
    boxShadow: "0 3px 12px rgba(0,0,0,0.035)",
    textAlign: "left",
    fontFamily: "Arial",
    cursor: "pointer"
  },
  tarjetaImg: { width: 62, height: 62, objectFit: "contain", flexShrink: 0 },
  tarjetaTitulo: { fontSize: 15, fontWeight: 700, color: "#4a463f", margin: 0 },
  tarjetaTexto: { fontSize: 12, color: "#8a8578", margin: "3px 0 0" },
  flecha: { marginLeft: "auto", fontSize: 22, color: "#c2b3d6" },
  borrar: {
    marginLeft: "auto",
    alignSelf: "flex-start",
    border: "none",
    background: "transparent",
    color: "#c2b8a8",
    fontSize: 18,
    cursor: "pointer",
    padding: 2
  },
  botonPequeno: {
    marginTop: 8,
    border: "none",
    borderRadius: 14,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#5a4636",
    background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
    cursor: "pointer"
  },
  error: { color: "#c96a6a", fontSize: 12, margin: "6px 0 0" }
};

// ✉️ BUZÓN: tarjeta en Inicio + ventana con los avisos
export default function Buzon({ usuario, irACarrera }) {
  const [avisos, setAvisos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const vistosRef = useRef(null);
  const salaPendiente = localStorage.getItem(CLAVE_SALA_CARRERA);

  useEffect(() => {
    if (!usuario) return;
    return vigilarBuzon(usuario.uid, (lista) => {
      // 📳 vibración suave si llega un hechizo nuevo con la app abierta
      const ids = lista.map((a) => a.id);
      if (vistosRef.current) {
        const nuevo = lista.find((a) => !a.leido && !vistosRef.current.includes(a.id));
        if (nuevo && navigator.vibrate) navigator.vibrate([120, 80, 120]);
      }
      vistosRef.current = ids;

      // 🤝 si alguien me ha añadido a sus compis, la añado yo también
      lista
        .filter((a) => a.tipo === "compi" && !a.procesado)
        .forEach((a) => {
          anadirCompis(usuario.uid, [{ uid: a.de, nombre: a.nombre }])
            .then(() => marcarAvisoProcesado(usuario.uid, a.id))
            .catch(() => {});
        });

      setAvisos(lista);
    });
  }, [usuario?.uid]);

  const noLeidos = avisos.filter((a) => !a.leido).length + (salaPendiente ? 1 : 0);

  if (avisos.length === 0 && !salaPendiente) return null;

  function abrir() {
    setError("");
    setAbierto(true);
    marcarLeidos(usuario.uid, avisos).catch(() => {});
  }

  async function aceptarReto(aviso) {
    setError("");
    try {
      await unirseSala(aviso.codigo, usuario.uid, localStorage.getItem(CLAVE_NOMBRE_APP) || "Participante");
      localStorage.setItem(CLAVE_SALA_CARRERA, aviso.codigo);
      borrarAviso(usuario.uid, aviso.id).catch(() => {});
      irACarrera();
    } catch (e) {
      setError(e.message || "No se ha podido entrar en la carrera.");
    }
  }

  function contenidoAviso(a) {
    if (a.tipo === "compi") {
      return {
        imagen: iconoSobre,
        texto: `${a.nombre} te ha añadido a sus compis`,
        sub: `Ya podéis mandaros hechizos · ${haceCuanto(a.fecha)}`
      };
    }
    const h = HECHIZOS[a.hechizo] || HECHIZOS.animo;
    return { imagen: h.imagen, texto: h.texto, sub: `De ${a.nombre} · ${haceCuanto(a.fecha)}` };
  }

  return (
    <>
      <style>{cssHechizos}</style>

      <button onClick={abrir} style={est.tarjeta}>
        <img
          src={iconoSobre}
          alt=""
          className={noLeidos > 0 ? "sobre-latido" : ""}
          style={est.tarjetaImg}
        />
        <span>
          <p style={est.tarjetaTitulo}>
            {noLeidos > 0 ? `Tienes ${noLeidos} ${noLeidos === 1 ? "aviso" : "avisos"}` : "Tu buzón"}
          </p>
          <p style={est.tarjetaTexto}>
            {noLeidos > 0 ? "Toca para abrir el buzón" : "No hay nada nuevo"}
          </p>
        </span>
        <span style={est.flecha}>›</span>
      </button>

      {abierto && (
        <div className="aviso-fondo" style={estHechizos.avisoFondo} onClick={() => setAbierto(false)}>
          <div className="aviso-tarjeta" style={estHechizos.avisoTarjeta} onClick={(e) => e.stopPropagation()}>
            <p style={estHechizos.titulo}>Tu buzón</p>
            <p style={estHechizos.subtitulo}>Lo que te han mandado tus compis</p>

            {salaPendiente && (
              <div style={{ ...estHechizos.fila, cursor: "default" }}>
                <img src={iconoReto} alt="" style={estHechizos.filaImg} />
                <span>
                  <p style={estHechizos.filaTexto}>Tienes una carrera en marcha ({salaPendiente})</p>
                  <button onClick={irACarrera} style={est.botonPequeno}>
                    Volver a entrar
                  </button>
                </span>
              </div>
            )}

            {avisos.map((a) => {
              const c = contenidoAviso(a);
              return (
                <div key={a.id} style={{ ...estHechizos.fila, cursor: "default" }}>
                  <img src={c.imagen} alt="" style={estHechizos.filaImg} />
                  <span>
                    <p style={estHechizos.filaTexto}>{c.texto}</p>
                    <p style={estHechizos.filaSub}>{c.sub}</p>
                    {a.hechizo === "reto" && a.codigo && (
                      <button onClick={() => aceptarReto(a)} style={est.botonPequeno}>
                        Unirme a la carrera
                      </button>
                    )}
                  </span>
                  <button
                    onClick={() => borrarAviso(usuario.uid, a.id).catch(() => {})}
                    title="Borrar"
                    style={est.borrar}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {avisos.length === 0 && !salaPendiente && (
              <p style={estHechizos.subtitulo}>No tienes avisos.</p>
            )}

            {error && <p style={{ ...est.error, textAlign: "center" }}>{error}</p>}

            <button onClick={() => setAbierto(false)} style={estHechizos.cerrar}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}