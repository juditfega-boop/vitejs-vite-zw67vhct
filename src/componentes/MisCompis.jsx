import { useEffect, useState } from "react";
import { styles } from "../estilos";
import {
  asegurarPerfil,
  anadirCompiPorCodigo,
  listarCompis,
  mandarHechizo,
  hechizosRestantes,
  CLAVE_NOMBRE_APP,
  CLAVE_SALA_CARRERA,
  pedirEmpujon,
  empujonPedidoHoy,
  quitarCompi
} from "../servicios/compis";
import { crearSala } from "../servicios/salas";
import { HECHIZOS, ORDEN_HECHIZOS, estHechizos, cssHechizos } from "./hechizos";

const est = {
  codigo: {
    fontSize: 30,
    letterSpacing: 8,
    fontWeight: 700,
    color: "#5b4a3a",
    textAlign: "center",
    margin: "4px 0 6px"
  },
  filaCompi: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    boxSizing: "border-box",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #f0e7da",
    padding: "12px 2px",
    textAlign: "left",
    fontFamily: "Arial",
    cursor: "pointer"
  },
  inicial: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #efe7f6, #f7e6e8)",
    color: "#6b5a7a",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  nombre: { fontSize: 15, fontWeight: 700, color: "#4a463f", margin: 0 },
  accion: { marginLeft: "auto", fontSize: 12, color: "#a08cc4", whiteSpace: "nowrap" },
  ok: { color: "#6a9a6a", textAlign: "center", fontSize: 14, margin: "10px 0" },
  error: { color: "#c96a6a", textAlign: "center", fontSize: 14, margin: "10px 0" },
  fila2: { display: "flex", gap: 8 },
  mas: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
    color: "#5a4636",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0
  },
  quitar: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    background: "#f9e3e3",
    color: "#c96a6a",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0,
    marginLeft: 8
  },
  codigoPequeno: { fontSize: 22, letterSpacing: 6, fontWeight: 700, color: "#5b4a3a", textAlign: "center", margin: "2px 0 4px" }
};

export default function MisCompis({ usuario, volver, irACarrera, irAPerfil }) {
  const [perfil, setPerfil] = useState(null);
  const [compis, setCompis] = useState([]);
  const [anadiendo, setAnadiendo] = useState(false);
  const [paraQuitar, setParaQuitar] = useState(null);
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [compiElegida, setCompiElegida] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [ocupada, setOcupada] = useState(false);
  const [empujonPedido, setEmpujonPedido] = useState(() => empujonPedidoHoy());
  const [eligiendoEmpujon, setEligiendoEmpujon] = useState(false);
  const [elegidosEmpujon, setElegidosEmpujon] = useState([]);

  async function cargar() {
    try {
      const porDefecto = localStorage.getItem(CLAVE_NOMBRE_APP) || "";
      const p = await asegurarPerfil(usuario.uid, porDefecto);
      setPerfil(p);
      setCompis(await listarCompis(p.compis));
    } catch (e) {
      setError("No se ha podido cargar. Comprueba tu conexión.");
    }
  }

  useEffect(() => {
    if (usuario) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.uid]);

  function avisar(texto) {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 2500);
  }

  async function anadir() {
    if (codigoNuevo.trim().length !== 6) return setError("El código tiene 6 caracteres.");
    setOcupada(true);
    setError("");
    try {
      const n = await anadirCompiPorCodigo(usuario.uid, perfil.nombre, codigoNuevo);
      setCodigoNuevo("");
      setAnadiendo(false);
      avisar(`${n || "Tu compi"} ya está en tu lista ✨`);
      await cargar();
    } catch (e) {
      setError(e.message || "No se ha podido añadir.");
    }
    setOcupada(false);
  }

  async function enviar(hechizo) {
    const para = compiElegida;
    setOcupada(true);
    setError("");
    try {
      if (hechizo === "reto") {
        // el reto abre una partida y te lleva a la sala de espera
        const codigoSala = await crearSala(usuario.uid, perfil.nombre);
        await mandarHechizo(usuario.uid, perfil.nombre, para.uid, "reto", { codigo: codigoSala });
        localStorage.setItem(CLAVE_SALA_CARRERA, codigoSala);
        setCompiElegida(null);
        irACarrera();
        return;
      }
      await mandarHechizo(usuario.uid, perfil.nombre, para.uid, hechizo);
      setCompiElegida(null);
      avisar(`Hechizo enviado a ${para.nombre} ✨`);
    } catch (e) {
      setError(e.message || "No se ha podido enviar.");
    }
    setOcupada(false);
  }

  function marcarParaEmpujon(uid) {
    setElegidosEmpujon((lista) => (lista.includes(uid) ? lista.filter((x) => x !== uid) : [...lista, uid]));
  }

  async function pedirUnEmpujon() {
    setOcupada(true);
    setError("");
    try {
      const elegidos = compis.filter((c) => elegidosEmpujon.includes(c.uid));
      await pedirEmpujon(usuario.uid, perfil.nombre, elegidos);
      setEmpujonPedido(true);
      setEligiendoEmpujon(false);
      avisar("Empujón pedido ✨");
    } catch (e) {
      setError(e.message || "No se ha podido pedir.");
    }
    setOcupada(false);
  }

  async function confirmarQuitar() {
    const c = paraQuitar;
    setOcupada(true);
    setError("");
    try {
      await quitarCompi(usuario.uid, c.uid);
      setCompis((lista) => lista.filter((x) => x.uid !== c.uid));
      setParaQuitar(null);
      avisar(`¡Abracadabra! ${c.nombre} ya no está en tu lista`);
    } catch (e) {
      setError("No se ha podido quitar.");
    }
    setOcupada(false);
  }

  if (!perfil) {
    return (
      <div style={styles.menuContainer}>
        <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 40 }}>
          {error || "Cargando…"}
        </p>
        <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>
      </div>
    );
  }

  const restantes = compiElegida ? hechizosRestantes(compiElegida.uid) : 0;

  return (
    <div style={styles.menuContainer}>
      <style>{cssHechizos}</style>

      <div style={styles.menuHeader}>
        <h1 style={styles.menuTitle}>Mis compis</h1>
        <div style={styles.menuUnderline} />
      </div>

      {mensaje && <p style={est.ok}>{mensaje}</p>}

      {perfil.nombre === "Sin nombre" && (
        <div style={{ ...styles.configCard, textAlign: "center", background: "#fbf3e6" }}>
          <p style={{ ...styles.configSubLabel, margin: "0 0 8px" }}>
            Todavía no tienes nombre en la app. Es el que verán tus compis.
          </p>
          <button onClick={irAPerfil} style={{ ...styles.ctaButton, width: "auto", margin: 0, padding: "8px 16px", fontSize: 14 }}>
            Ponerme nombre
          </button>
        </div>
      )}

      {/* 🤗 ¿Hoy te cuesta? */}
      <div
        style={{
          ...styles.configCard,
          background: "linear-gradient(135deg, #fbefe6, #f8e9ee)",
          textAlign: "center",
          padding: "14px 16px"
        }}
      >
        <p style={{ ...styles.configCardTitle, margin: 0 }}>¿Hoy te cuesta?</p>
        {empujonPedido ? (
          <p style={{ ...styles.configSubLabel, margin: "4px 0 0" }}>Empujón pedido. Sus hechizos te llegarán al buzón 💛</p>
        ) : (
          <>
            <p style={{ ...styles.configSubLabel, margin: "4px 0 10px" }}>Elige a quién avisar y te mandarán ánimos.</p>
            <button
              onClick={() => {
                setError("");
                setElegidosEmpujon([]);
                setEligiendoEmpujon(true);
              }}
              disabled={compis.length === 0}
              style={{
                ...styles.ctaButton,
                width: "auto",
                display: "inline-block",
                margin: "0 auto",
                padding: "9px 20px",
                fontSize: 14,
                opacity: compis.length === 0 ? 0.55 : 1
              }}
            >
              Necesito un empujón
            </button>
          </>
        )}
      </div>

      {/* 💌 mis compis */}
      <div style={styles.configCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <p style={{ ...styles.configCardTitle, margin: 0, flex: 1 }}>Mis compis ({compis.length})</p>
          <button
            onClick={() => {
              setError("");
              setAnadiendo(true);
            }}
            aria-label="Añadir compi"
            style={est.mas}
          >
            +
          </button>
        </div>
        {compis.length === 0 ? (
          <p style={{ ...styles.configSubLabel, marginTop: 8 }}>
            Todavía no tienes compis. Se añaden al jugar una carrera online, o con el + y su código.
          </p>
        ) : (
          compis.map((c) => (
            <div key={c.uid} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f0e7da" }}>
              <button
                onClick={() => {
                  setError("");
                  setCompiElegida(c);
                }}
                style={{ ...est.filaCompi, borderBottom: "none", flex: 1, minWidth: 0 }}
              >
                <span style={est.inicial}>{c.nombre.charAt(0).toUpperCase()}</span>
                <p style={est.nombre}>{c.nombre}</p>
                <span style={est.accion}>Mandar hechizo ›</span>
              </button>
              <button onClick={() => setParaQuitar(c)} aria-label={`Quitar a ${c.nombre}`} style={est.quitar}>
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {error && !compiElegida && !anadiendo && !paraQuitar && <p style={est.error}>{error}</p>}

      <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>

      {anadiendo && (
        <div className="aviso-fondo" style={estHechizos.avisoFondo} onClick={() => setAnadiendo(false)}>
          <div className="aviso-tarjeta" style={estHechizos.avisoTarjeta} onClick={(e) => e.stopPropagation()}>
            <p style={estHechizos.titulo}>Añadir compi</p>
            <p style={estHechizos.subtitulo}>Escribe el código de tu compi</p>
            <div style={est.fila2}>
              <input
                type="text"
                value={codigoNuevo}
                maxLength={6}
                onChange={(e) => setCodigoNuevo(e.target.value.toUpperCase())}
                placeholder="Su código"
                style={{ ...styles.nombreInput, marginBottom: 0, letterSpacing: 3, fontWeight: 700, flex: 1, minWidth: 0 }}
              />
              <button
                onClick={anadir}
                disabled={ocupada}
                style={{ ...styles.ctaButton, width: "auto", marginTop: 0, padding: "10px 16px", fontSize: 14 }}
              >
                Añadir
              </button>
            </div>
            <p style={{ ...estHechizos.subtitulo, margin: "16px 0 0" }}>Y para que te añada a ti, pásale tu código:</p>
            <p style={est.codigoPequeno}>{perfil.codigo}</p>
            {error && <p style={est.error}>{error}</p>}
            <button onClick={() => setAnadiendo(false)} style={estHechizos.cerrar}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {paraQuitar && (
        <div className="aviso-fondo" style={estHechizos.avisoFondo} onClick={() => setParaQuitar(null)}>
          <div className="aviso-tarjeta" style={estHechizos.avisoTarjeta} onClick={(e) => e.stopPropagation()}>
            <p style={estHechizos.titulo}>¿Tu hechizo es hacer desaparecer a {paraQuitar.nombre}?</p>
            <p style={estHechizos.subtitulo}>
              Si es de quienes te lían para salir en vez de estudiar, adelante. Dejará de estar en tu lista (tú seguirás en la suya).
            </p>
            {error && <p style={est.error}>{error}</p>}
            <button
              onClick={confirmarQuitar}
              disabled={ocupada}
              style={{ ...styles.ctaButton, marginTop: 14 }}
            >
              Sí, ¡abracadabra!
            </button>
            <button onClick={() => setParaQuitar(null)} style={estHechizos.cerrar}>
              No, que se quede
            </button>
          </div>
        </div>
      )}

      {eligiendoEmpujon && (
        <div className="aviso-fondo" style={estHechizos.avisoFondo} onClick={() => setEligiendoEmpujon(false)}>
          <div className="aviso-tarjeta" style={estHechizos.avisoTarjeta} onClick={(e) => e.stopPropagation()}>
            <p style={estHechizos.titulo}>¿A quién le pides un empujón?</p>
            <p style={estHechizos.subtitulo}>Le llegará un aviso para mandarte ánimos</p>
            {compis.map((c) => {
              const marcado = elegidosEmpujon.includes(c.uid);
              return (
                <button key={c.uid} onClick={() => marcarParaEmpujon(c.uid)} style={est.filaCompi}>
                  <span style={est.inicial}>{c.nombre.charAt(0).toUpperCase()}</span>
                  <p style={est.nombre}>{c.nombre}</p>
                  <span
                    style={{
                      marginLeft: "auto",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: marcado ? "none" : "1.5px solid #d8cbe6",
                      background: marcado ? "linear-gradient(135deg, #b9a8de, #e2a3a9)" : "transparent",
                      color: "#fff",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {marcado ? "✓" : ""}
                  </span>
                </button>
              );
            })}
            {error && <p style={est.error}>{error}</p>}
            <button
              onClick={pedirUnEmpujon}
              disabled={ocupada || elegidosEmpujon.length === 0}
              style={{ ...styles.ctaButton, marginTop: 14, opacity: elegidosEmpujon.length === 0 ? 0.55 : 1 }}
            >
              {elegidosEmpujon.length ? `Pedir empujón (${elegidosEmpujon.length})` : "Pedir empujón"}
            </button>
            <button onClick={() => setEligiendoEmpujon(false)} style={estHechizos.cerrar}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {compiElegida && (
        <div className="aviso-fondo" style={estHechizos.avisoFondo} onClick={() => setCompiElegida(null)}>
          <div className="aviso-tarjeta" style={estHechizos.avisoTarjeta} onClick={(e) => e.stopPropagation()}>
            <p style={estHechizos.titulo}>Un hechizo para {compiElegida.nombre}</p>
            <p style={estHechizos.subtitulo}>
              {restantes > 0
                ? `Hoy le puedes mandar ${restantes} más`
                : "Por hoy ya le has mandado bastantes ✨"}
            </p>
            {ORDEN_HECHIZOS.map((id) => (
              <button
                key={id}
                onClick={() => enviar(id)}
                disabled={ocupada || restantes <= 0}
                style={{ ...estHechizos.fila, opacity: restantes <= 0 ? 0.5 : 1 }}
              >
                <img src={HECHIZOS[id].imagen} alt="" style={estHechizos.filaImg} />
                <span>
                  <p style={estHechizos.filaTexto}>{HECHIZOS[id].texto}</p>
                  {id === "reto" && <p style={estHechizos.filaSub}>Se abre una partida y te espera en la sala</p>}
                </span>
              </button>
            ))}
            {error && <p style={est.error}>{error}</p>}
            <button onClick={() => setCompiElegida(null)} style={estHechizos.cerrar}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}