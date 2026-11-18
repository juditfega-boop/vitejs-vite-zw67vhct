import { useEffect, useRef, useState } from "react";
import portada from "../assets/portada.jpeg";
import capaDecorado from "../assets/kit/intro/intro-decorado.png";
import capaRaices from "../assets/kit/intro/intro-raices.png";
import capaPlanta from "../assets/kit/intro/intro-planta.png";
import capaBrote from "../assets/kit/intro/intro-brote.png";

// 🖼️ todo se prepara al cargar, para que no aparezca a medias
[portada, capaDecorado, capaRaices, capaPlanta, capaBrote].forEach((src) => {
  const img = new Image();
  img.src = src;
});

// Medidas de la portada (px). Las capas son una franja recortada de ella (de y=700 a y=1400).
const PORTADA = { ancho: 852, alto: 1846 };
const FRANJA = { arriba: 700, alto: 700 };
const SUELO = 1138; // donde el tallo se mete en la tierra
const INICIO_PLANTA = 752; // la flor, lo más alto de la planta
const BROTE = { x: 481, y: 972, ancho: 96, alto: 150 }; // el brote pequeño de la portada

// 🍃 hojas de la propia planta de la portada (x, y, ancho, alto en px de la portada),
// de dónde salen (en % del ancho de pantalla) y dónde caen en la tierra
const HOJAS = [
  { x: 285, y: 800, w: 47, h: 80, sale: 15, cae: [392, 1128], giro: -50, retraso: 900 },
  { x: 271, y: 901, w: 69, h: 33, sale: 80, cae: [470, 1122], giro: 40, retraso: 1150 },
  { x: 365, y: 862, w: 36, h: 66, sale: 35, cae: [436, 1138], giro: -25, retraso: 1450, semilla: "planta" },
  { x: 337, y: 1010, w: 60, h: 45, sale: 65, cae: [455, 1130], giro: 60, retraso: 1650 },
  { x: 442, y: 924, w: 38, h: 30, sale: 92, cae: [514, 1117], giro: 80, retraso: 1900, semilla: "brote" },
  { x: 383, y: 1077, w: 36, h: 24, sale: 8, cae: [375, 1124], giro: -70, retraso: 2100 }
];

// 🎨 el resto de la portada aparece por partes (x, y, ancho, alto en px de la portada)
const PARTES = [
  { x: 0, y: 0, w: 430, h: 330, efecto: "flor", retraso: 4.3 },      // acuarela de arriba a la izquierda y pájaros
  { x: 520, y: 0, w: 332, h: 330, efecto: "flor", retraso: 4.55 },   // acuarela de arriba a la derecha
  { x: 0, y: 1430, w: 300, h: 416, efecto: "flor", retraso: 4.75 },  // acuarela de abajo a la izquierda
  { x: 540, y: 1440, w: 312, h: 406, efecto: "flor", retraso: 4.95 }, // acuarela de abajo a la derecha
  { x: 360, y: 290, w: 130, h: 90, efecto: "flor", retraso: 4.9 },   // corazón
  { x: 80, y: 380, w: 720, h: 205, efecto: "escribe", retraso: 5.0 }, // título y subrayado
  { x: 160, y: 585, w: 540, h: 110, efecto: "flor", retraso: 5.9 }   // "la app para preparar…"
];

const DURACION = 7100; // la portada exacta termina de aparecer a los 6,9 s
const pct = (y) => ((y - FRANJA.arriba) / FRANJA.alto) * 100;
const recorte = (p) => {
  const arriba = (p.y / PORTADA.alto) * 100;
  const izq = (p.x / PORTADA.ancho) * 100;
  const der = 100 - ((p.x + p.w) / PORTADA.ancho) * 100;
  const abajo = 100 - ((p.y + p.h) / PORTADA.alto) * 100;
  return { arriba, izq, der, abajo };
};

const cssPartes = PARTES.map((p, i) => {
  const r = recorte(p);
  if (p.efecto === "escribe") {
    return `
      .intro-parte-${i} { clip-path: inset(${r.arriba}% ${r.der}% ${r.abajo}% ${r.izq}%);
        animation: introEscribe${i} 1.3s cubic-bezier(0.45, 0.1, 0.4, 1) ${p.retraso}s both; }
      @keyframes introEscribe${i} {
        from { clip-path: inset(${r.arriba}% ${100 - r.izq}% ${r.abajo}% ${r.izq}%); }
        to { clip-path: inset(${r.arriba}% ${r.der}% ${r.abajo}% ${r.izq}%); }
      }`;
  }
  return `
    .intro-parte-${i} { clip-path: inset(${r.arriba}% ${r.der}% ${r.abajo}% ${r.izq}%);
      animation: introFlorece 1.3s ease ${p.retraso}s both; }`;
}).join("\n");

const css = `
  .intro-fondo { animation: introFondo 1.1s ease 0.2s both; }
  @keyframes introFondo { from { background-color: #e6d3b2; } to { background-color: #f7f6f4; } }
  .intro-aparece { animation: introAparece var(--dura, 0.9s) ease var(--retraso, 0s) both; }
  @keyframes introAparece { from { opacity: 0; } to { opacity: 1; } }
  @keyframes introSeVa { to { opacity: 0; } }
  @keyframes introFlorece {
    from { opacity: 0; filter: blur(7px); }
    to { opacity: 1; filter: blur(0); }
  }

  .intro-brote-crece { animation: introCrece 1.3s cubic-bezier(0.3, 0.1, 0.3, 1) 3.2s both; }
  @keyframes introCrece { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0 0 0 0); } }

  .intro-raices { animation: introRaices 1.6s cubic-bezier(0.3, 0.1, 0.3, 1) 2.7s both; }
  @keyframes introRaices {
    from { clip-path: inset(${pct(SUELO)}% 0 ${100 - pct(SUELO)}% 0); }
    to { clip-path: inset(${pct(SUELO)}% 0 0 0); }
  }
  .intro-planta { animation: introPlanta 1.9s cubic-bezier(0.3, 0.1, 0.3, 1) 3.2s both; }
  @keyframes introPlanta {
    from { clip-path: inset(${pct(SUELO)}% 0 ${100 - pct(SUELO)}% 0); }
    to { clip-path: inset(${pct(INICIO_PLANTA) - 1}% 0 ${100 - pct(SUELO)}% 0); }
  }

  .intro-hoja { animation: introCae 1.6s cubic-bezier(0.35, 0.1, 0.55, 1) both; }
  @keyframes introCae {
    0% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--giro)); }
    10% { opacity: 1; }
    35% { transform: translate(calc(var(--dx) * 0.6 + 18px), calc(var(--dy) * 0.65)) rotate(calc(var(--giro) * -0.6)); }
    60% { transform: translate(calc(var(--dx) * 0.25 - 14px), calc(var(--dy) * 0.3)) rotate(calc(var(--giro) * 0.4)); }
    80% { opacity: 1; transform: translate(0, 0) rotate(8deg); }
    100% { opacity: 0; transform: translate(0, 14px) rotate(8deg) scale(0.75); }
  }

  .intro-hoja.semilla { animation-name: introSemilla; animation-duration: 1.9s; }
  @keyframes introSemilla {
    0% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--giro)); }
    8% { opacity: 1; }
    35% { transform: translate(calc(var(--dx) * 0.6 + 18px), calc(var(--dy) * 0.6)) rotate(calc(var(--giro) * -0.6)); }
    60% { transform: translate(calc(var(--dx) * 0.2 - 12px), calc(var(--dy) * 0.25)) rotate(calc(var(--giro) * 0.4)); }
    76% { opacity: 1; transform: translate(0, 0) rotate(0deg); filter: drop-shadow(0 0 0 rgba(255,214,150,0)); }
    86% { opacity: 1; transform: translate(0, 4px) rotate(0deg) scale(0.9); filter: drop-shadow(0 0 6px rgba(255,214,150,0.95)); }
    100% { opacity: 0; transform: translate(0, 16px) rotate(0deg) scale(0.5); filter: drop-shadow(0 0 2px rgba(255,214,150,0)); }
  }

  .intro-salida { animation: introSeVa 0.6s ease forwards; }
  ${cssPartes}
`;

// 📐 dónde se ve la portada en pantalla (igual que una imagen "cover" centrada)
function medir() {
  const VW = window.innerWidth;
  const VH = window.innerHeight;
  const s = Math.max(VW / PORTADA.ancho, VH / PORTADA.alto);
  return { VW, VH, s, ox: (VW - PORTADA.ancho * s) / 2, oy: (VH - PORTADA.alto * s) / 2 };
}

/**
 * 🌸 Animación de entrada, hecha con la propia ilustración de la portada:
 * caen las hojas de la planta y se hunden en la tierra; de una nacen las raíces y la planta
 * con su flor, y de otra el brote pequeño. Después florece el resto de la portada.
 * Un toque en cualquier sitio la salta.
 */
export default function IntroAnimada({ onFin }) {
  const [m] = useState(medir);
  const [saliendo, setSaliendo] = useState(false);
  const terminado = useRef(false);

  // al terminar sola ya es la portada exacta: se quita sin fundido (no se nota nada).
  // si se salta con un toque, a mitad, entonces sí se funde.
  function terminar(saltada) {
    if (terminado.current) return;
    terminado.current = true;
    if (!saltada) {
      onFin();
      return;
    }
    setSaliendo(true);
    setTimeout(onFin, 600);
  }

  useEffect(() => {
    const id = setTimeout(() => terminar(false), DURACION);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { s, ox, oy, VW, VH } = m;
  const aPantalla = (x, y) => [ox + x * s, oy + y * s];
  const franja = {
    position: "absolute",
    left: ox,
    top: oy + FRANJA.arriba * s,
    width: PORTADA.ancho * s,
    height: FRANJA.alto * s,
    pointerEvents: "none"
  };
  const portadaEntera = {
    position: "absolute",
    left: ox,
    top: oy,
    width: PORTADA.ancho * s,
    height: PORTADA.alto * s,
    pointerEvents: "none"
  };

  // el brote pequeño de la portada (crece donde cae su hoja)
  const [fx, fy] = aPantalla(BROTE.x, BROTE.y);

  return (
    <div
    onClick={() => terminar(true)}
      className={`intro-fondo ${saliendo ? "intro-salida" : ""}`}
      style={{ position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden", cursor: "pointer", background: "#f7f6f4" }}
    >
      <style>{css}</style>

      {/* 1. la tierra y las acuarelas de la ilustración */}
      <img src={capaDecorado} alt="" className="intro-aparece" style={{ ...franja, "--retraso": "0.9s", "--dura": "1s" }} />

      {/* 2. las raíces crecen hacia abajo */}
      <img src={capaRaices} alt="" className="intro-raices" style={franja} />

      {/* 3. la planta sube desde la tierra hasta la flor */}
      <img src={capaPlanta} alt="" className="intro-planta" style={franja} />

      {/* el brote pequeño crece donde cayó su hoja */}
      <img
        src={capaBrote}
        alt=""
        className="intro-brote-crece"
        style={{ position: "absolute", left: fx, top: fy, width: BROTE.ancho * s, height: BROTE.alto * s, pointerEvents: "none" }}
      />

      {/* hojas de la planta que caen y se hunden en la tierra */}
      {HOJAS.map((h, i) => {
        const [lx, ly] = aPantalla(h.cae[0], h.cae[1]);
        const w = h.w * s;
        const alto = h.h * s;
        return (
          <div
            key={i}
            className={`intro-hoja ${h.semilla ? "semilla" : ""}`}
            style={{
              position: "absolute",
              left: lx - w / 2,
              top: ly - alto,
              width: w,
              height: alto,
              backgroundImage: `url(${capaPlanta})`,
              backgroundSize: `${PORTADA.ancho * s}px ${FRANJA.alto * s}px`,
              backgroundPosition: `${-h.x * s}px ${-(h.y - FRANJA.arriba) * s}px`,
              animationDelay: `${h.retraso}ms`,
              "--giro": `${h.giro}deg`,
              "--dx": `${(h.sale / 100) * VW - lx}px`,
              "--dy": `${-ly - 40}px`,
              pointerEvents: "none"
            }}
          />
        );
      })}

      {/* 4. el resto de la portada florece por partes: acuarelas, corazón, título que se escribe… */}
      {PARTES.map((p, i) => (
        <img key={i} src={portada} alt="" className={`intro-parte-${i}`} style={portadaEntera} />
      ))}

      {/* 5. y al final, la portada exacta (ya no se nota: es lo mismo que hay en pantalla) */}
      <img src={portada} alt="" className="intro-aparece" style={{ ...portadaEntera, "--retraso": "6.3s", "--dura": "0.6s" }} />
    </div>
  );
}