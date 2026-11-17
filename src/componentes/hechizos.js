import hechizoAnimo from "../assets/kit/hechizo-animo.png";
import hechizoCafe from "../assets/kit/hechizo-cafe.png";
import hechizoAlLio from "../assets/kit/hechizo-al-lio.png";
import hechizoReto from "../assets/kit/hechizo-reto-carrera.png";

// ✨ los hechizos que se pueden mandar (para añadir uno nuevo, basta con añadirlo aquí)
export const HECHIZOS = {
  animo: { imagen: hechizoAnimo, texto: "¡Ánimo, hoy vas a estudiar genial!" },
  cafe: { imagen: hechizoCafe, texto: "Te invito a un café, descansa 5 minutos" },
  lio: { imagen: hechizoAlLio, texto: "¡Al lío! Yo ya estoy estudiando" },
  reto: { imagen: hechizoReto, texto: "Te reto a una carrera" }
};

export const ORDEN_HECHIZOS = ["animo", "cafe", "lio", "reto"];

// estilos compartidos por el buzón y Mis compis
export const estHechizos = {
  avisoFondo: {
    position: "fixed",
    inset: 0,
    background: "rgba(74, 70, 63, 0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000
  },
  avisoTarjeta: {
    background: "linear-gradient(160deg, #fbf8f3, #f4ecf6)",
    borderRadius: 28,
    padding: "22px 18px 12px",
    width: "100%",
    maxWidth: 380,
    maxHeight: "85vh",
    overflowY: "auto",
    boxSizing: "border-box",
    boxShadow: "0 10px 40px rgba(74, 70, 63, 0.18)"
  },
  titulo: { fontSize: 18, fontWeight: 700, color: "#4a463f", margin: "0 0 4px", textAlign: "center" },
  subtitulo: { fontSize: 13, color: "#8a8578", margin: "0 0 14px", textAlign: "center" },
  fila: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    boxSizing: "border-box",
    background: "#fff",
    border: "1px solid #efe7da",
    borderRadius: 20,
    padding: "10px 14px",
    marginBottom: 10,
    textAlign: "left",
    fontFamily: "Arial",
    color: "#4a463f",
    cursor: "pointer"
  },
  filaImg: { width: 52, height: 52, objectFit: "contain", flexShrink: 0 },
  filaTexto: { fontSize: 14, fontWeight: 700, color: "#4a463f", margin: 0, lineHeight: 1.35 },
  filaSub: { fontSize: 12, color: "#8a8578", margin: "3px 0 0" },
  cerrar: {
    display: "block",
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#8a8578",
    fontSize: 13,
    padding: 12,
    cursor: "pointer",
    fontFamily: "Arial"
  }
};

export const cssHechizos = `
  .aviso-fondo { animation: avisoFondo 0.3s ease-out both; }
  @keyframes avisoFondo { from { opacity: 0; } to { opacity: 1; } }
  .aviso-tarjeta { animation: avisoTarjeta 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
  @keyframes avisoTarjeta { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
  .sobre-latido { animation: sobreLatido 2.4s ease-in-out infinite; }
  @keyframes sobreLatido { 0%, 100% { transform: rotate(0deg); } 8% { transform: rotate(-6deg); } 16% { transform: rotate(5deg); } 24% { transform: rotate(0deg); } }
`;

export function haceCuanto(fecha) {
  if (!fecha || !fecha.toDate) return "ahora";
  const seg = Math.floor((Date.now() - fecha.toDate().getTime()) / 1000);
  if (seg < 60) return "ahora";
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  const dias = Math.floor(seg / 86400);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}