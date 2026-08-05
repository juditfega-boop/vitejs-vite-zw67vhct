import { useState, useEffect } from "react";
import { obtenerMisImpugnaciones } from "../servicios/impugnaciones";
import { observarSesion } from "../servicios/auth";
import { styles } from "../estilos";

const ETIQUETAS_ESTADO = {
  pendiente: { texto: "Pendiente de revisión", color: "#8a8578" },
  resuelto: { texto: "Resuelta", color: "#6a9a6a" },
  revisado: { texto: "Revisada", color: "#6a9a6a" },
  rechazado: { texto: "No procede", color: "#c96a6a" }
};

export default function MisImpugnaciones() {
  const [usuario, setUsuario] = useState(undefined);
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const unsubscribe = observarSesion((u) => setUsuario(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!usuario) {
      setLista([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    obtenerMisImpugnaciones().then((datos) => {
      setLista(datos);
      setCargando(false);
    });
  }, [usuario, abierto]);

  if (!usuario) return null; // solo tiene sentido si hay sesión iniciada

  return (
    <div style={styles.configCard}>
      <button
        onClick={() => setAbierto((v) => !v)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer"
        }}
      >
        <span style={styles.configCardTitle}>Mis impugnaciones {lista.length > 0 ? `(${lista.length})` : ""}</span>
        <span style={{ color: "#8a8578" }}>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <>
          {cargando ? (
            <p style={{ ...styles.configSubLabel, marginTop: 10 }}>Cargando...</p>
          ) : lista.length === 0 ? (
            <p style={{ ...styles.configSubLabel, marginTop: 10 }}>
              Todavía no has enviado ninguna impugnación con esta cuenta.
            </p>
          ) : (
            <div style={{ marginTop: 10 }}>
              {lista.map((imp) => {
                const estado = ETIQUETAS_ESTADO[imp.estado] || ETIQUETAS_ESTADO.pendiente;
                return (
                  <div
                    key={imp.id}
                    style={{
                      background: "#faf7f2", borderRadius: 14, padding: "12px 14px",
                      marginBottom: 10, fontSize: 13
                    }}
                  >
                    <p style={{ margin: "0 0 6px", color: "#4a463f", lineHeight: 1.4 }}>
                      {imp.textoPregunta || "Pregunta sin texto guardado"}
                    </p>
                    <p style={{ margin: "0 0 4px", color: "#8a8578" }}>
                      Motivo: {imp.motivo}
                    </p>
                    <p style={{ margin: 0, fontWeight: 700, color: estado.color }}>
                      {estado.texto}
                    </p>
                    {imp.respuesta && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #e4ddcf" }}>
                        <p style={{ margin: 0, color: "#4a463f" }}>
                          <b>Respuesta:</b> {imp.respuesta}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}