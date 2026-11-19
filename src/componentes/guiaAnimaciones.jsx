import { useEffect, useState } from "react";
import semana0 from "../assets/kit/jardin-semana-0.png";
import semana1 from "../assets/kit/jardin-semana-1.png";
import semana2 from "../assets/kit/jardin-semana-2.png";
import semana3 from "../assets/kit/jardin-semana-3.png";
import semana4 from "../assets/kit/jardin-semana-4.png";
import semana5 from "../assets/kit/jardin-semana-5.png";
import semana6 from "../assets/kit/jardin-semana-6.png";
import semana7 from "../assets/kit/jardin-semana-7.png";
import carpetaRoja from "../assets/kit/icono-carpetita-prioritarios.png";
import carpetaAmarilla from "../assets/kit/icono-carpetita-seguimiento.png";
import carpetaVerde from "../assets/kit/icono-carpetita-resueltos.png";
import iconoTaza from "../assets/kit/icono-taza-perfil.png";
import iconoLlave from "../assets/kit/icono-explora.png";

// 🎞️ Mini-animaciones de la visita guiada: van solas, en bucle, y ocupan poco.

function useFotograma(total, ms) {
  const [f, setF] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setF((x) => (x + 1) % total), ms);
    return () => clearInterval(id);
  }, [total, ms]);
  return f;
}

const marco = {
  height: 96,
  borderRadius: 18,
  background: "#f8f3ea",
  margin: "4px 0 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  overflow: "hidden",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#4a463f"
};

// 🌱 la planta de la semana: de semilla a flor, día a día
const PLANTAS = [semana0, semana1, semana2, semana3, semana4, semana5, semana6, semana7];
export function AnimPlanta() {
  const f = useFotograma(10, 650); // 8 etapas + una pausa con la flor
  const etapa = Math.min(7, f);
  return (
    <div style={marco}>
      <img src={PLANTAS[etapa]} alt="" style={{ height: 84, width: 48, objectFit: "contain" }} />
      <div style={{ display: "flex", gap: 4 }}>
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <span
            key={d}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i < etapa ? "#9fbf8f" : "#ece4d8",
              color: i < etapa ? "#fff" : "#8a8070",
              fontWeight: 700,
              transition: "background 0.3s ease"
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

// 🔁 los tres niveles de Erre que erre
const NIVELES = [
  { nombre: "Con pistas", detalle: "eliges la palabra" },
  { nombre: "Huecos", detalle: "la escribes tú" },
  { nombre: "De memoria", detalle: "escribes el apartado" }
];
export function AnimErre() {
  const f = useFotograma(3, 1700);
  const hueco = { display: "inline-block", minWidth: 54, padding: "1px 6px", borderRadius: 8, border: "1.5px dashed #d8cbb6", background: "#fffaf2" };
  return (
    <div style={{ ...marco, flexDirection: "column", gap: 6, padding: "0 12px" }}>
      <div style={{ display: "flex", gap: 6 }}>
        {NIVELES.map((n, i) => (
          <span
            key={n.nombre}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 999,
              background: i === f ? "linear-gradient(135deg, #d9cdf0, #f3cdd2)" : "#ece4d8",
              color: i === f ? "#5b4a3a" : "#8a8070",
              transition: "background 0.3s ease"
            }}
          >
            {i + 1}. {n.nombre}
          </span>
        ))}
      </div>
      <p key={f} style={{ margin: 0, fontSize: 12.5, textAlign: "center", lineHeight: 1.5, animation: "guiaAparece 0.4s ease both" }}>
        {f === 0 && (
          <>
            España se constituye en un Estado <span style={{ ...hueco, borderStyle: "solid", borderColor: "#8fb89a", background: "#e3ecd9" }}>social</span> y democrático…
          </>
        )}
        {f === 1 && (
          <>
            España se constituye en un Estado <span style={hueco}>s…</span> y democrático…
          </>
        )}
        {f === 2 && <span style={{ ...hueco, minWidth: 220, textAlign: "left" }}>España se constituye en un Estado…</span>}
      </p>
      <span style={{ fontSize: 11, color: "#7d7468" }}>{NIVELES[f].detalle}</span>
    </div>
  );
}

// 🗂️ una pregunta que pasa de prioritaria a resuelta
export function AnimCarpetas() {
  const f = useFotograma(4, 1300); // 0 roja, 1 amarilla, 2 verde, 3 pausa
  const pos = Math.min(2, f);
  const carpetas = [
    { img: carpetaRoja, texto: "Prioritaria" },
    { img: carpetaAmarilla, texto: "Seguimiento" },
    { img: carpetaVerde, texto: "Resuelta" }
  ];
  return (
    <div style={{ ...marco, position: "relative", gap: 18 }}>
      {carpetas.map((c, i) => (
        <span key={c.texto} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 74, fontSize: 10.5, color: "#6e6256" }}>
          <img src={c.img} alt="" style={{ width: 40, height: 40, objectFit: "contain", opacity: i === pos ? 1 : 0.55, transition: "opacity 0.3s ease" }} />
          {c.texto}
        </span>
      ))}
      <span
        style={{
          position: "absolute",
          top: 8,
          left: `calc(50% - 92px + ${pos * 92}px - 22px)`,
          width: 44,
          height: 18,
          borderRadius: 6,
          background: "#fffdf9",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          fontSize: 10,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ["#c96a6a", "#b08a3a", "#5f8a5a"][pos],
          transition: "left 0.6s ease, color 0.3s ease"
        }}
      >
        {pos === 0 ? "✗" : pos === 1 ? "✓" : "✓✓"}
      </span>
    </div>
  );
}

// 🗓️ el calendario se marca solo cuando completas tu ración
const LETRAS = [
  { l: "E", fondo: "#dbe7d3" },
  { l: "E", fondo: "#dbe7d3" },
  { l: "R", fondo: "#e6dcf3" },
  { l: "L", fondo: "#f3e1bd" },
  { l: "E", fondo: "#dbe7d3" },
  { l: "R", fondo: "#e6dcf3" },
  { l: "M", fondo: "#f6dade" }
];
export function AnimCalendario() {
  const f = useFotograma(9, 700);
  return (
    <div style={{ ...marco, gap: 5 }}>
      {LETRAS.map((d, i) => (
        <span
          key={i}
          style={{
            position: "relative",
            width: 34,
            height: 40,
            borderRadius: 10,
            background: d.fondo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#5b4a3a"
          }}
        >
          {d.l === "L" ? <img src={iconoTaza} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} /> : d.l}
          {i < f && d.l !== "L" && (
            <span
              style={{
                position: "absolute",
                right: -4,
                top: -5,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#8fb89a",
                color: "#fff",
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "guiaAparece 0.3s ease both"
              }}
            >
              ✓
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// 🔑 abrir la llave de una sala: fallo, pista y ¡abierta!
export function AnimLlave() {
  const f = useFotograma(3, 1800);
  const caja = (valor, mal) => ({
    display: "inline-block",
    minWidth: 30,
    padding: "2px 6px",
    margin: "0 3px",
    borderRadius: 8,
    textAlign: "center",
    fontWeight: 700,
    border: `1.5px solid ${mal ? "#e2a3a9" : valor ? "#8fb89a" : "#d8cbb6"}`,
    background: mal ? "#f9e3e3" : valor ? "#e3ecd9" : "#fffaf2"
  });
  return (
    <div style={{ ...marco, gap: 12, padding: "0 10px" }}>
      <img src={iconoLlave} alt="" style={{ width: 62, height: 62, objectFit: "contain", transform: f === 2 ? "rotate(-12deg)" : "none", transition: "transform 0.4s ease" }} />
      <div key={f} style={{ fontSize: 12.5, lineHeight: 1.5, animation: f === 0 ? "guiaTiembla 0.45s ease 0.3s" : "guiaAparece 0.4s ease both" }}>
        <b style={{ display: "block", marginBottom: 2 }}>Título I</b>
        Del <span style={caja(f === 2, f === 0)}>{f === 0 ? "9" : f === 1 ? "…" : "10"}</span> al{" "}
        <span style={caja(f === 2, f === 0)}>{f === 0 ? "50" : f === 1 ? "…" : "55"}</span>
        <span style={{ display: "block", fontSize: 11, color: f === 2 ? "#5f8a5a" : "#8a6a4f", marginTop: 3 }}>
          {f === 0 ? "No es correcto, vuelve a intentarlo" : f === 1 ? "Una pista: empieza en el artículo 10." : "¡Sala abierta!"}
        </span>
      </div>
    </div>
  );
}

export const ANIMACIONES = {
  llave: AnimLlave, planta: AnimPlanta, erre: AnimErre, carpetas: AnimCarpetas, calendario: AnimCalendario };
