import { useState } from "react";
import { MANO } from "./Hub";
import casaIcono from "../assets/casa-icono.png";
import iconoLibro from "../assets/kit/icono-libro-estudiar.png";
import iconoTest from "../assets/kit/icono-test.png";
import iconoDados from "../assets/kit/icono-dados-minijuegos.png";
import iconoExpediente from "../assets/kit/icono-fin-expedientes.png";

// 🧭 Guía rápida: sale solo la primera vez que se abre la nueva Inicio
export const CLAVE_GUIA = "opo_guia_vista_v1";

const FILAS = [
  { icono: casaIcono, nombre: "Inicio", texto: "Lo que toca hoy, tu ración y tu jardín." },
  { icono: iconoLibro, nombre: "Estudiar", texto: "Para memorizar: Explora, Erre que erre, Construye, Conecta y tu tarjetero." },
  { icono: iconoTest, nombre: "Test", texto: "Preguntas como las del examen, el simulacro y lo que tienes que reforzar." },
  { icono: iconoDados, nombre: "Juegos", texto: "Para repasar jugando, a tu aire o con tus compis." },
  { icono: iconoExpediente, nombre: "Expediente", texto: "Tu evolución, tu calendario, tus compis y tu cuenta." }
];

export default function GuiaRapida() {
  const [abierta, setAbierta] = useState(() => {
    try {
      return !localStorage.getItem(CLAVE_GUIA);
    } catch {
      return false;
    }
  });

  if (!abierta) return null;

  function cerrar() {
    try {
      localStorage.setItem(CLAVE_GUIA, "1");
    } catch {}
    setAbierta(false);
  }

  return (
    <div
      onClick={cerrar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(74,70,63,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        animation: "aparecerGuia 0.3s ease both"
      }}
    >
      <style>{"@keyframes aparecerGuia { from { opacity: 0; } to { opacity: 1; } }"}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fdfaf4",
          borderRadius: 26,
          padding: "20px 18px 16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#4a463f"
        }}
      >
        <p style={{ ...MANO, margin: "0 0 4px", fontSize: 30, lineHeight: 1, color: "#5b4a3a" }}>Tu cuaderno, por dentro</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#5c5850" }}>Abajo tienes la barra para moverte. Cada pestaña es:</p>
        {FILAS.map((f) => (
          <div key={f.nombre} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
            <img src={f.icono} alt="" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontSize: 13, lineHeight: 1.4 }}>
              <b>{f.nombre}:</b> {f.texto}
            </span>
          </div>
        ))}
        <p style={{ margin: "8px 0 14px", fontSize: 12.5, color: "#5c5850" }}>
          Cuando estés dentro de un test o un juego, la casita te devuelve a Inicio.
        </p>
        <button
          onClick={cerrar}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 18,
            padding: "13px 16px",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "inherit",
            color: "#5a4636",
            background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
            cursor: "pointer"
          }}
        >
          ¡Vamos!
        </button>
      </div>
    </div>
  );
}
