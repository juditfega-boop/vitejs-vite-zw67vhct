import { useEffect, useState } from "react";
import { styles } from "../estilos";
import { asegurarPerfil, cambiarMiNombre, CLAVE_NOMBRE_APP } from "../servicios/compis";

// ⓘ botoncito de información que despliega una explicación corta
function Info({ abierto, onClick, etiqueta }) {
  return (
    <button
      onClick={onClick}
      aria-label={etiqueta}
      aria-expanded={abierto}
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: "1.5px solid #c9b9a5",
        background: abierto ? "#f3ede3" : "transparent",
        color: "#8a7d6f",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        lineHeight: 1,
        padding: 0,
        cursor: "pointer",
        flexShrink: 0
      }}
    >
      i
    </button>
  );
}

const fila = { display: "flex", alignItems: "center", gap: 8 };
const etiqueta = { fontSize: 13, color: "#8a8578", margin: 0 };
const valor = { fontSize: 17, fontWeight: 700, color: "#4a463f", margin: "4px 0 0" };
const ayuda = { fontSize: 12.5, color: "#6e6256", lineHeight: 1.45, margin: "6px 0 0" };
const botonPequeno = {
  marginLeft: "auto",
  border: "none",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  color: "#5b4a3a",
  background: "#f3ede3",
  cursor: "pointer"
};

// 🙋 En Mi perfil: mi nombre en la app y mi código de compi
export default function MiIdentidad({ usuario }) {
  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [info, setInfo] = useState(null); // "nombre" | "codigo" | null
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!usuario) return;
    const porDefecto = localStorage.getItem(CLAVE_NOMBRE_APP) || "";
    asegurarPerfil(usuario.uid, porDefecto)
      .then((p) => {
        setPerfil(p);
        setNombre(p.nombre === "Sin nombre" ? "" : p.nombre);
        if (!porDefecto) setEditando(true);
      })
      .catch(() => setAviso("No se ha podido cargar. Comprueba tu conexión."));
  }, [usuario?.uid]);

  function avisar(texto) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 2200);
  }

  async function guardar() {
    const n = nombre.trim().slice(0, 20);
    if (!n) return setAviso("Escribe un nombre.");
    try {
      await cambiarMiNombre(usuario.uid, n);
      setPerfil((p) => ({ ...p, nombre: n }));
      setEditando(false);
      avisar("Nombre guardado");
    } catch {
      setAviso("No se ha podido guardar el nombre.");
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(perfil.codigo);
      avisar("Código copiado");
    } catch {
      avisar("Mantén pulsado el código para copiarlo");
    }
  }

  if (!perfil) {
    return aviso ? <p style={{ ...styles.configSubLabel, textAlign: "center" }}>{aviso}</p> : null;
  }

  return (
    <div style={styles.configCard}>
      {/* nombre */}
      <div style={fila}>
        <p style={etiqueta}>Mi nombre en la app</p>
        <Info abierto={info === "nombre"} onClick={() => setInfo(info === "nombre" ? null : "nombre")} etiqueta="Qué es el nombre en la app" />
      </div>
      {info === "nombre" && (
        <p style={ayuda}>Es el que ven tus compis y el que sale en la carrera. Tu correo no lo ve nadie.</p>
      )}
      {editando ? (
        <div style={{ ...fila, marginTop: 6 }}>
          <input
            type="text"
            value={nombre}
            maxLength={20}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cómo quieres que te vean"
            style={{ ...styles.nombreInput, marginBottom: 0, flex: 1, minWidth: 0 }}
          />
          <button onClick={guardar} style={{ ...botonPequeno, marginLeft: 0, background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)", fontWeight: 700 }}>
            Guardar
          </button>
        </div>
      ) : (
        <div style={fila}>
          <p style={valor}>{perfil.nombre}</p>
          <button onClick={() => setEditando(true)} style={botonPequeno}>
            Cambiar
          </button>
        </div>
      )}

      <div style={{ height: 1, background: "#f0e7da", margin: "14px 0" }} />

      {/* código */}
      <div style={fila}>
        <p style={etiqueta}>Mi código de compi</p>
        <Info abierto={info === "codigo"} onClick={() => setInfo(info === "codigo" ? null : "codigo")} etiqueta="Qué es el código de compi" />
      </div>
      {info === "codigo" && (
        <p style={ayuda}>Pásaselo a quien quieras para que te añada a sus compis. Tú añades a los tuyos con el + de Mis compis.</p>
      )}
      <div style={fila}>
        <p style={{ ...valor, letterSpacing: 5 }}>{perfil.codigo}</p>
        <button onClick={copiar} style={botonPequeno}>
          Copiar
        </button>
      </div>

      {aviso && <p style={{ ...ayuda, color: "#6a9a6a", textAlign: "center" }}>{aviso}</p>}
    </div>
  );
}
