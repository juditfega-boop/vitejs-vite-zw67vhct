import { useState } from "react";
import PanelAdmin from "./PanelAdmin";
import SubirPreguntas from "./SubirPreguntas";
import { styles } from "../estilos";

// 🗝️ apartado plegable solo para la administradora
export default function PanelAdministracion() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto((a) => !a)}
        style={{
          ...styles.configCard,
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit"
        }}
      >
        <span style={{ ...styles.configCardTitle, margin: 0 }}>Administración</span>
        <span
          style={{
            color: "#8a8578",
            transform: abierto ? "rotate(180deg)" : "none",
            transition: "transform 0.2s"
          }}
        >
          ▼
        </span>
      </button>

      {abierto && (
        <>
          <PanelAdmin />
          <SubirPreguntas />
        </>
      )}
    </>
  );
}