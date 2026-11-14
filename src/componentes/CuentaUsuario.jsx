import { useState } from "react";
import { registrarse, iniciarSesion, cerrarSesion, mensajeErrorAuth, recuperarContrasena } from "../servicios/auth";
import { ADMIN_UID } from "../servicios/accesos";
import PanelAdmin from "./PanelAdmin";
import { styles } from "../estilos";

export default function CuentaUsuario({ usuario, estadoAcceso }) {
  const [modo, setModo] = useState("login"); // "login" | "registro"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeOk, setMensajeOk] = useState("");

  async function enviar() {
    setError("");
    setMensajeOk("");
    if (!email.trim() || !password) return;
    setCargando(true);
    try {
      if (modo === "registro") {
        await registrarse(email.trim(), password);
      } else {
        await iniciarSesion(email.trim(), password);
      }
      setPassword("");
    } catch (e) {
      setError(mensajeErrorAuth(e.code));
    }
    setCargando(false);
  }

  async function olvideContrasena() {
    setError("");
    setMensajeOk("");
    if (!email.trim()) {
      setError("Escribe tu correo arriba y vuelve a pulsar aquí.");
      return;
    }
    setCargando(true);
    try {
      await recuperarContrasena(email.trim());
      setMensajeOk(
        "Si hay una cuenta con ese correo, te hemos enviado un enlace para crear una contraseña nueva. Mira también en spam."
      );
    } catch (e) {
      setError(mensajeErrorAuth(e.code));
    }
    setCargando(false);
  }

  async function salir() {
    await cerrarSesion();
    setMensajeOk("Sesión cerrada.");
  }

  if (usuario === undefined) {
    return null; // cargando el estado inicial, evita parpadeo
  }

  if (usuario) {
    return (
      <>
        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Tu cuenta</p>
          <p style={styles.configSubLabel}>Sesión iniciada como <b>{usuario.email}</b></p>
          {estadoAcceso === "pendiente" && (
            <p style={styles.configSubLabel}>
              🌱 Tu solicitud de acceso está pendiente. Cuando la aceptemos, se desbloqueará todo la próxima vez que abras la app.
            </p>
          )}
          {estadoAcceso === "aprobada" && (
            <p style={styles.configSubLabel}>🌿 Tienes acceso completo.</p>
          )}
          <button onClick={salir} style={styles.linkVolver}>
            Cerrar sesión
          </button>
          {mensajeOk && <p style={{ ...styles.configSubLabel, marginTop: 6 }}>{mensajeOk}</p>}
        </div>
        {usuario.uid === ADMIN_UID && <PanelAdmin />}
      </>
    );
  }

  return (
    <div style={styles.configCard}>
      <p style={styles.configCardTitle}>Crear cuenta / Iniciar sesión</p>
      <p style={styles.configSubLabel}>
      Crea tu cuenta para solicitar el acceso completo a la app. En cuanto la revisemos, se desbloqueará todo.
      </p>

      <div style={styles.pillGroup}>
        <button
          className="pill"
          onClick={() => setModo("login")}
          style={{ ...styles.pillBtn, ...(modo === "login" ? styles.pillBtnActiva : {}) }}
        >
          Iniciar sesión
        </button>
        <button
          className="pill"
          onClick={() => setModo("registro")}
          style={{ ...styles.pillBtn, ...(modo === "registro" ? styles.pillBtnActiva : {}) }}
        >
          Crear cuenta
        </button>
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo electrónico"
        style={{ ...styles.nombreInput, marginTop: 12 }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña (mínimo 6 caracteres)"
        style={styles.nombreInput}
      />

      {error && <p style={{ ...styles.configSubLabel, color: "#c96a6a" }}>{error}</p>}

      <button
        onClick={enviar}
        disabled={cargando || !email.trim() || !password}
        style={{
          ...styles.ctaButton,
          ...(cargando || !email.trim() || !password ? styles.ctaButtonDisabled : {})
        }}
      >
        {cargando ? "Un momento..." : modo === "registro" ? "Crear cuenta" : "Iniciar sesión"}
      </button>

      {modo === "login" && (
        <button onClick={olvideContrasena} disabled={cargando} style={styles.linkVolver}>
          ¿Has olvidado tu contraseña?
        </button>
      )}

      {mensajeOk && (
        <p style={{ ...styles.configSubLabel, marginTop: 6 }}>{mensajeOk}</p>
      )}
    </div>
  );
}