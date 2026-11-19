import iconoCandado from "../assets/kit/icono-candado.png";

// 🎨 Piezas comunes de los menús (Estudiar, Test, Juegos, Mi expediente):
// título manuscrito con su subrayado de color y tarjetas grandes.
export const MANO = { fontFamily: "'Caveat', cursive", fontWeight: 700 };

// mismos colores por sección en toda la app
export const COLOR_SECCION = {
  estudiar: { linea: "#b9a8de", fondo: "#ebe4f7", fondoClaro: "#f1ecfa" },
  test: { linea: "#e2a3a9", fondo: "#f8e6e8", fondoClaro: "#fbf0f1" },
  juegos: { linea: "#8fb89a", fondo: "#e2f0e5", fondoClaro: "#eef5ea" },
  expediente: { linea: "#d9a25c", fondo: "#f6ead8", fondoClaro: "#fbf3e6" }
};

// fondo de papel con manchas de acuarela muy suaves
export const FONDO_PAPEL = {
  backgroundColor: "#f8f3ea",
  backgroundImage:
    "radial-gradient(circle at 12% 8%, rgba(233,185,182,0.22), rgba(233,185,182,0) 34%), " +
    "radial-gradient(circle at 92% 30%, rgba(201,184,222,0.20), rgba(201,184,222,0) 32%), " +
    "radial-gradient(circle at 10% 92%, rgba(169,185,154,0.22), rgba(169,185,154,0) 36%)",
  backgroundAttachment: "fixed"
};

export const PAGINA = {
  width: "100%",
  maxWidth: 480,
  margin: "0 auto",
  padding: "22px 18px 0",
  boxSizing: "border-box",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#4a463f"
};

export function TituloHub({ titulo, subtitulo, color }) {
  return (
    <div style={{ margin: "4px 0 16px" }}>
      <h1 style={{ ...MANO, margin: 0, fontSize: 40, lineHeight: 1, color: "#5b4a3a" }}>{titulo}</h1>
      <span
        style={{
          display: "block",
          width: 96,
          height: 8,
          borderRadius: "6px 10px 5px 9px",
          background: color,
          opacity: 0.7,
          marginTop: 3
        }}
      />
      {subtitulo && <p style={{ margin: "9px 0 0", fontSize: 13.5, color: "#5c5850" }}>{subtitulo}</p>}
    </div>
  );
}

export function SubtituloMano({ children, style }) {
  return (
    <p style={{ ...MANO, margin: "22px 0 8px", fontSize: 26, lineHeight: 1, color: "#5b4a3a", ...style }}>
      {children}
    </p>
  );
}

export function Rejilla({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>{children}</div>
  );
}

// tarjeta grande: icono, nombre, explicación y una rayita de color
export function Tile({ icono, nombre, texto, fondo, linea, alto = 150, ancho = 1, bloqueado, onClick, etiqueta, guia }) {
  return (
    <button
      data-guia={guia}
      onClick={onClick}
      className="tile-hub"
      style={{
        gridColumn: `span ${ancho}`,
        position: "relative",
        display: "flex",
        flexDirection: ancho === 2 ? "row" : "column",
        alignItems: ancho === 2 ? "center" : "flex-start",
        gap: ancho === 2 ? 14 : 0,
        background: fondo,
        border: "none",
        borderRadius: 22,
        padding: 14,
        minHeight: alto,
        boxSizing: "border-box",
        textAlign: "left",
        fontFamily: "inherit",
        color: "#4a463f",
        cursor: "pointer",
        boxShadow: "0 3px 10px rgba(0,0,0,0.035)",
        ...(bloqueado ? { opacity: 0.55, filter: "grayscale(35%)" } : {})
      }}
    >
      {bloqueado && (
        <img src={iconoCandado} alt="Bloqueado" style={{ position: "absolute", top: 10, right: 10, width: 26 }} />
      )}
      <img
        src={icono}
        alt=""
        style={{ flexShrink: 0, width: ancho === 2 ? 92 : 68, height: ancho === 2 ? 92 : 68, objectFit: "contain" }}
      />
      <span style={{ display: "flex", flexDirection: "column", flex: 1, alignSelf: "stretch", justifyContent: ancho === 2 ? "center" : "flex-start" }}>
        <span style={{ fontSize: 15, fontWeight: 700, marginTop: ancho === 2 ? 0 : 8 }}>{nombre}</span>
        <span style={{ fontSize: 12.5, color: "#5c5850", lineHeight: 1.4, marginTop: 3 }}>{texto}</span>
        {etiqueta && (
          <span
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
              fontSize: 11.5,
              fontWeight: 700,
              color: "#6e5a4a",
              background: `${linea}38`,
              borderRadius: 999,
              padding: "2px 9px"
            }}
          >
            {etiqueta}
          </span>
        )}
        <span
          style={{
            width: 34,
            height: 3,
            borderRadius: 3,
            background: linea,
            marginTop: "auto",
            ...(ancho === 2 ? { display: "none" } : { position: "relative", top: 4 })
          }}
        />
      </span>
    </button>
  );
}

// fila de Mi expediente: icono, nombre y explicación
export function Fila({ icono, nombre, texto, bloqueado, onClick, guia }) {
  return (
    <button
      data-guia={guia}
      onClick={onClick}
      className="tile-hub"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        boxSizing: "border-box",
        background: "#fffcf7",
        border: "none",
        borderRadius: 20,
        padding: "12px 16px 12px 12px",
        marginBottom: 10,
        textAlign: "left",
        fontFamily: "inherit",
        color: "#4a463f",
        cursor: "pointer",
        boxShadow: "0 3px 10px rgba(0,0,0,0.035)",
        ...(bloqueado ? { opacity: 0.55, filter: "grayscale(35%)" } : {})
      }}
    >
      <img src={icono} alt="" style={{ flexShrink: 0, width: 52, height: 52, objectFit: "contain" }} />
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{nombre}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "#5c5850", marginTop: 2 }}>{texto}</span>
      </span>
      {bloqueado ? (
        <img src={iconoCandado} alt="Bloqueado" style={{ width: 24 }} />
      ) : (
        <span style={{ fontSize: 20, color: "#b8a993" }}>›</span>
      )}
    </button>
  );
}

export const cssHub = `
  .tile-hub { transition: transform 0.15s ease; }
  .tile-hub:active { transform: scale(0.97); }
`;
