import { useEffect, useState } from "react";
import { styles } from "../estilos";
import {
  asegurarPerfil,
  cambiarMiNombre,
  anadirCompiPorCodigo,
  listarCompis,
  mandarHechizo,
  hechizosRestantes,
  CLAVE_NOMBRE_APP,
  CLAVE_SALA_CARRERA,
  pedirEmpujon,
  empujonPedidoHoy
} from "../servicios/compis";
import { crearSala } from "../servicios/salas";
import { HECHIZOS, ORDEN_HECHIZOS, estHechizos, cssHechizos } from "./hechizos";
import iconoSobre from "../assets/kit/icono-buzon-sobre.png";

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
  fila2: { display: "flex", gap: 8 }
};

export default function MisCompis({ usuario, volver, irACarrera }) {
  const [perfil, setPerfil] = useState(null);
  const [compis, setCompis] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [compiElegida, setCompiElegida] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [ocupada, setOcupada] = useState(false);
  const [empujonPedido, setEmpujonPedido] = useState(() => empujonPedidoHoy());

  async function cargar() {
    try {
      const porDefecto = localStorage.getItem(CLAVE_NOMBRE_APP) || "";
      const p = await asegurarPerfil(usuario.uid, porDefecto);
      setPerfil(p);
      setNombre(p.nombre);
      if (!porDefecto) setEditandoNombre(true);
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

  async function guardarNombre() {
    const n = nombre.trim().slice(0, 20);
    if (!n) return setError("Escribe un nombre.");
    setError("");
    try {
      await cambiarMiNombre(usuario.uid, n);
      setPerfil((p) => ({ ...p, nombre: n }));
      setEditandoNombre(false);
      avisar("Nombre guardado");
    } catch (e) {
      setError("No se ha podido guardar el nombre.");
    }
  }

  async function anadir() {
    if (codigoNuevo.trim().length !== 6) return setError("El código tiene 6 caracteres.");
    setOcupada(true);
    setError("");
    try {
      const n = await anadirCompiPorCodigo(usuario.uid, perfil.nombre, codigoNuevo);
      setCodigoNuevo("");
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

  async function pedirUnEmpujon() {
    setOcupada(true);
    setError("");
    try {
      await pedirEmpujon(usuario.uid, perfil.nombre, compis);
      setEmpujonPedido(true);
      avisar("Empujón pedido ✨");
    } catch (e) {
      setError(e.message || "No se ha podido pedir.");
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

      <img
        src={iconoSobre}
        alt=""
        style={{ display: "block", width: 110, margin: "0 auto 16px" }}
      />

      {mensaje && <p style={est.ok}>{mensaje}</p>}

      <div style={styles.configCard}>
        <p style={styles.configCardTitle}>Tu nombre en la app</p>
        {editandoNombre ? (
          <>
            <input
              type="text"
              value={nombre}
              maxLength={20}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Cómo quieres que te vean"
              style={styles.nombreInput}
            />
            <button onClick={guardarNombre} style={{ ...styles.ctaButton, marginTop: 4 }}>
              Guardar
            </button>
          </>
        ) : (
          <div style={styles.configRow}>
            <span style={{ fontSize: 16, color: "#4a463f" }}>{perfil.nombre}</span>
            <button onClick={() => setEditandoNombre(true)} style={{ ...styles.quizVolverBtn, fontSize: 13 }}>
              Cambiar
            </button>
          </div>
        )}
        <p style={{ ...styles.configSubLabel, marginTop: 8 }}>
          Es el que ven tus compis y el que sale en la carrera. Tu correo no lo ve nadie.
        </p>
      </div>

      <div style={{ ...styles.configCard, textAlign: "center" }}>
        <p style={styles.configSubLabel}>Tu código de compi</p>
        <p style={est.codigo}>{perfil.codigo}</p>
        <p style={styles.configSubLabel}>Pásaselo a quien quieras para que te añada</p>
      </div>

      <div style={styles.configCard}>
        <p style={styles.configCardTitle}>Añadir compi</p>
        <div style={est.fila2}>
          <input
            type="text"
            value={codigoNuevo}
            maxLength={6}
            onChange={(e) => setCodigoNuevo(e.target.value.toUpperCase())}
            placeholder="Código de 6 caracteres"
            style={{ ...styles.nombreInput, marginBottom: 0, letterSpacing: 3, fontWeight: 700 }}
          />
          <button
            onClick={anadir}
            disabled={ocupada}
            style={{ ...styles.ctaButton, width: "auto", marginTop: 0, padding: "10px 18px", fontSize: 14 }}
          >
            Añadir
          </button>
        </div>
      </div>

      <div
        style={{
          ...styles.configCard,
          background: "linear-gradient(135deg, #fbefe6, #f8e9ee)",
          display: "flex",
          alignItems: "center",
          gap: 14
        }}
      >
        <img src={HECHIZOS.animo.imagen} alt="" style={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ ...styles.configCardTitle, margin: 0 }}>¿Hoy te cuesta?</p>
          {empujonPedido ? (
            <p style={{ ...styles.configSubLabel, margin: "4px 0 0" }}>
              Empujón pedido. Tus compis ya lo saben: sus hechizos te llegarán al buzón 💛
            </p>
          ) : (
            <>
              <p style={{ ...styles.configSubLabel, margin: "4px 0 8px" }}>
                Avisa a tus compis y te mandarán ánimos.
              </p>
              <button
                onClick={pedirUnEmpujon}
                disabled={ocupada || compis.length === 0}
                style={{
                  ...styles.ctaButton,
                  width: "auto",
                  margin: 0,
                  padding: "10px 18px",
                  fontSize: 14,
                  opacity: compis.length === 0 ? 0.55 : 1
                }}
              >
                Necesito un empujón
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.configCard}>
        <p style={styles.configCardTitle}>Tus compis ({compis.length})</p>
        {compis.length === 0 ? (
          <p style={styles.configSubLabel}>
            Todavía no tienes compis. Se añaden solas al jugar una carrera online, o con su código.
          </p>
        ) : (
          compis.map((c) => (
            <button
              key={c.uid}
              onClick={() => {
                setError("");
                setCompiElegida(c);
              }}
              style={est.filaCompi}
            >
              <span style={est.inicial}>{c.nombre.charAt(0).toUpperCase()}</span>
              <p style={est.nombre}>{c.nombre}</p>
              <span style={est.accion}>Mandar hechizo ›</span>
            </button>
          ))
        )}
      </div>

      {error && !compiElegida && <p style={est.error}>{error}</p>}

      <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>

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