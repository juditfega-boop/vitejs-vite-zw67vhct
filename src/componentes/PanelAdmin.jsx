import { useEffect, useState } from "react";
import { listarPendientes, aprobarCuenta } from "../servicios/accesos";
import { styles } from "../estilos";

export default function PanelAdmin() {
  const [pendientes, setPendientes] = useState(null);
  const [error, setError] = useState("");

  async function cargar() {
    setError("");
    try {
      setPendientes(await listarPendientes());
    } catch {
      setError("No se pudo cargar la lista. Revisa las reglas de Firestore.");
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function aprobar(uid) {
    try {
      await aprobarCuenta(uid);
      setPendientes((lista) => lista.filter((p) => p.uid !== uid));
    } catch {
      setError("No se pudo aprobar. Inténtalo de nuevo.");
    }
  }

  return (
    <div style={styles.configCard}>
      <p style={styles.configCardTitle}>Solicitudes de acceso</p>

      {error && <p style={{ ...styles.configSubLabel, color: "#c96a6a" }}>{error}</p>}
      {pendientes === null && !error && <p style={styles.configSubLabel}>Cargando…</p>}
      {pendientes && pendientes.length === 0 && (
        <p style={styles.configSubLabel}>No hay solicitudes pendientes.</p>
      )}

      {pendientes &&
        pendientes.map((p) => (
          <div
            key={p.uid}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 0",
              borderTop: "1px solid #efe6d8"
            }}
          >
            <span style={{ ...styles.configSubLabel, margin: 0, wordBreak: "break-all" }}>
              {p.email}
              <br />
              <span style={{ fontSize: 11, color: p.correoConfirmado ? "#6a9a6a" : "#c9a06a" }}>
                {p.correoConfirmado ? "✉️ Correo confirmado" : "✉️ Sin confirmar el correo"}
              </span>
            </span>
            <button
              onClick={() => aprobar(p.uid)}
              style={{ ...styles.ctaButton, width: "auto", padding: "8px 18px", margin: 0 }}
            >
              Aceptar
            </button>
          </div>
        ))}

      <button onClick={cargar} style={styles.linkVolver}>
        Actualizar lista
      </button>
    </div>
  );
}