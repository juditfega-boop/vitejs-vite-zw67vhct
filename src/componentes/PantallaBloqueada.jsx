import { styles } from "../estilos";
import iconoPlantita from "../assets/kit/icono-plantita-evolucion.png";

export default function PantallaBloqueada({ estado, irAPerfil, volverMenu }) {
  if (estado === "cargando") {
    return (
      <div style={styles.menuContainer}>
        <p style={styles.configSubLabel}>Comprobando tu cuenta…</p>
      </div>
    );
  }

  const pendiente = estado === "pendiente";

  return (
    <div style={styles.menuContainer}>
      <div style={styles.configCard}>
        <img src={iconoPlantita} alt="" style={{ width: 110, display: "block", margin: "0 auto 12px" }} />
        <p style={{ ...styles.configCardTitle, textAlign: "center" }}>
          {pendiente ? "Tu solicitud está en camino" : "Esta parte es para cuentas aprobadas"}
        </p>
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          {pendiente
            ? "Hemos recibido tu solicitud. En cuanto la aceptemos, se desbloqueará todo la próxima vez que abras la app."
            : "Crea tu cuenta y, cuando la revisemos, tendrás acceso a todo. Mientras tanto puedes probar algunas preguntas en Estudiar y el minijuego Construye la Constitución."}
        </p>
        {!pendiente && (
          <button onClick={irAPerfil} style={styles.ctaButton}>
            Crear cuenta o iniciar sesión
          </button>
        )}
      </div>
      <button onClick={volverMenu} style={styles.linkVolver}>
        <span className="hoja-volver"></span> Volver al menú
      </button>
    </div>
  );
}