import casaIcono from "../assets/casa-icono.png";
import iconoLibro from "../assets/kit/icono-libro-estudiar.png";
import iconoTest from "../assets/kit/icono-test.png";
import iconoDados from "../assets/kit/icono-dados-minijuegos.png";
import iconoExpediente from "../assets/kit/icono-fin-expedientes.png";

// 🧭 Barra inferior: solo en las cinco pantallas principales.
// Dentro de una tarea (un test, un juego, un examen…) no aparece.
export const ALTO_BARRA = 74;

const PESTANAS = [
  { id: "inicio", texto: "Inicio", icono: casaIcono, mancha: "rgba(233,185,182,0.55)" },
  { id: "estudiar", texto: "Estudiar", icono: iconoLibro, mancha: "rgba(201,184,222,0.65)" },
  { id: "test", texto: "Test", icono: iconoTest, mancha: "rgba(226,163,169,0.5)" },
  { id: "minijuegos", texto: "Juegos", icono: iconoDados, mancha: "rgba(169,196,154,0.6)" },
  { id: "expediente", texto: "Expediente", icono: iconoExpediente, mancha: "rgba(232,196,140,0.6)" }
];

export const PANTALLAS_CON_BARRA = PESTANAS.map((p) => p.id);

const cssBarra = `
  .barra-pestana { transition: transform 0.15s ease; }
  .barra-pestana:active { transform: scale(0.93); }
  @keyframes manchaBarra { from { opacity: 0; transform: scale(0.7) rotate(-8deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
`;

export default function BarraInferior({ activa, irA }) {
  return (
    <>
      <style>{cssBarra}</style>
      {/* hueco al final de la página para que la barra no tape lo último */}
      <div style={{ height: ALTO_BARRA + 24 }} />
      <nav
        data-guia="barra"
        aria-label="Navegación principal"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          boxSizing: "border-box",
          height: `calc(${ALTO_BARRA}px + env(safe-area-inset-bottom, 0px))`,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          display: "flex",
          alignItems: "center",
          background: "#fffdf9",
          borderTop: "1px solid #efe6d8",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -4px 16px rgba(90,70,50,0.05)",
          zIndex: 40,
          fontFamily: "Arial, Helvetica, sans-serif"
        }}
      >
        {PESTANAS.map((p) => {
          const esActiva = p.id === activa;
          return (
            <button
              key={p.id}
              data-guia={`tab-${p.id}`}
              className="barra-pestana"
              onClick={() => {
                window.scrollTo(0, 0);
                irA(p.id);
              }}
              aria-current={esActiva ? "page" : undefined}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "6px 0",
                fontFamily: "inherit"
              }}
            >
              <span style={{ position: "relative", width: 54, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* mancha de acuarela detrás de la pestaña activa */}
                {esActiva && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "48% 52% 44% 56% / 58% 42% 58% 42%",
                      background: `radial-gradient(circle at 40% 45%, ${p.mancha}, rgba(255,255,255,0) 72%)`,
                      animation: "manchaBarra 0.35s ease both"
                    }}
                  />
                )}
                <img
                  src={p.icono}
                  alt=""
                  style={{ position: "relative", width: 30, height: 30, objectFit: "contain", opacity: esActiva ? 1 : 0.8 }}
                />
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: esActiva ? 700 : 400,
                  color: esActiva ? "#5b4a3a" : "#8a8070",
                  whiteSpace: "nowrap"
                }}
              >
                {p.texto}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
