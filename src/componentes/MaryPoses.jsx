import { useEffect, useRef } from "react";
import saluda from "../assets/kit/mary/mary-pose-saluda.png";
import saludaBrazo from "../assets/kit/mary/mary-pose-saluda-brazo.png";
import estira from "../assets/kit/mary/mary-pose-estira.png";
import colgada from "../assets/kit/mary/mary-pose-colgada.png";
import impulso from "../assets/kit/mary/mary-pose-impulso.png";
import impulsoFalda from "../assets/kit/mary/mary-pose-impulso-falda.png";
import sube from "../assets/kit/mary/mary-pose-sube.png";
import agachada from "../assets/kit/mary/mary-pose-agachada.png";
import salta from "../assets/kit/mary/mary-pose-salta.png";

// 🎞️ Mary animada con sus posturas dibujadas: entre una y otra se funde suavemente
// mientras se mueve, se estira y se encoge, como en los dibujos animados.
// Cada postura tiene puntos de apoyo (pies, manos…) medidos en su dibujo.
export const ALTO_POSE = 318; // Mary de pie, de la coronilla a las botas
const POSES = {
  saluda: {
    img: saluda,
    w: 124,
    h: 318.5,
    anclas: { pies: [64.8, 316] },
    // el antebrazo que saluda va aparte y gira desde el codo
    brazo: { img: saludaBrazo, codo: [12.5, 84] }
  },
  estira: { img: estira, w: 168.5, h: 313, anclas: { pies: [45, 310.5], manos: [141, 12] } },
  colgada: { img: colgada, w: 96.5, h: 297.5, anclas: { agarre: [42.5, 15] } },
  impulso: { img: impulso, w: 127.5, h: 117, anclas: { borde: [70, 111] }, extra: { img: impulsoFalda, w: 85, h: 158.5, x: 16.5, y: 122.5 } },
  sube: { img: sube, w: 110.5, h: 291, anclas: { pieAlto: [32.5, 245] } },
  agachada: { img: agachada, w: 124, h: 266, anclas: { pies: [67.5, 261.5] } },
  salta: { img: salta, w: 143.5, h: 282.5, anclas: { pies: [62.2, 280] } }
};
const FUNDIDO = 120; // ms que dura el cambio de una postura a otra
const BANDA = 12; // franja del borde del bocadillo donde se le ven los antebrazos apoyados (por delante)

const suave = (k) => 0.5 - Math.cos(Math.PI * k) / 2;
const acelera = (k) => k * k * (1.4 - 0.4 * k); // caída: cada vez más deprisa
const frena = (k) => 1 - (1 - k) * (1 - k); // subida de un salto: frena arriba
const lerp = (a, b, k) => a + (b - a) * k;

function colocacion(c) {
  const ancla = POSES[c.pose].anclas[c.ancla];
  return { x: c.x, y: c.y, ax: ancla[0], ay: ancla[1], s: c.s, rot: c.rot || 0, sx: c.sx || 1, sy: c.sy || 1 };
}
function mezcla(a, b, k) {
  const r = {};
  Object.keys(a).forEach((n) => (r[n] = lerp(a[n], b[n], k)));
  return r;
}
// centro de la postura en la pantalla (para que al cambiar de una a otra no dé saltos)
function centro(c, pose) {
  const p = POSES[pose];
  const dx = (p.w / 2 - c.ax) * c.s * c.sx;
  const dy = (p.h / 2 - c.ay) * c.s * c.sy;
  const r = (c.rot * Math.PI) / 180;
  return [c.x + dx * Math.cos(r) - dy * Math.sin(r), c.y + dx * Math.sin(r) + dy * Math.cos(r)];
}

// 👋 sube desde abajo, se asienta y saluda con la mano
function clavesEntrada(L) {
  const pie = { pose: "saluda", ancla: "pies", x: L.wx, s: L.s };
  return [
    { ...pie, t: 0, y: L.H + 340, sy: 1.04 },
    { ...pie, t: 620, y: L.suelo - 10, sy: 1.03 },
    { ...pie, t: 780, y: L.suelo, sy: 0.95, sx: 1.03 },
    { ...pie, t: 960, y: L.suelo, sy: 1.01 },
    { ...pie, t: 1100, y: L.suelo },
    { ...pie, t: 1600, y: L.suelo, recorte: "bocadillo" }
  ];
}

// 🧗 se estira, se agarra al borde, se balancea, se impulsa, sube una pierna,
// se agacha encima del bocadillo, salta y se cuela por el agujero
function clavesTrepar(L) {
  const s = L.s;
  const R = "bocadillo";
  const gx = L.bx + 64; // donde se agarra: en la parte recta del borde de arriba
  const sFin = (L.hr * 2 * 0.86) / POSES.salta.w; // tan pequeñita que cabe entera por el agujero
  const pieFinX = L.hx - (POSES.salta.w / 2 - 62.2) * sFin;
  return [
    { pose: "saluda", ancla: "pies", t: 0, x: L.wx, y: L.suelo, s, recorte: R },
    { pose: "saluda", ancla: "pies", t: 160, x: L.wx, y: L.suelo, s, sy: 0.96, sx: 1.02, recorte: R },
    // se pone de puntillas y estira los brazos hacia el borde
    { pose: "estira", ancla: "manos", t: 480, x: gx + 4, y: L.by - 12, s, recorte: R },
    { pose: "estira", ancla: "manos", t: 640, x: gx + 3, y: L.by - 6, s, sy: 1.02, recorte: R },
    // un saltito y se agarra con las dos manos al borde
    { pose: "colgada", ancla: "agarre", t: 820, x: gx, y: L.by - 2, s, sy: 1.04, recorte: R },
    // cuelga y se balancea, cada vez menos
    { pose: "colgada", ancla: "agarre", t: 1050, x: gx, y: L.by - 1, s, rot: 6, recorte: R },
    { pose: "colgada", ancla: "agarre", t: 1300, x: gx, y: L.by - 2, s, rot: -3.5, recorte: R },
    { pose: "colgada", ancla: "agarre", t: 1500, x: gx, y: L.by - 2, s, rot: 1.5, recorte: R },
    { pose: "colgada", ancla: "agarre", t: 1660, x: gx, y: L.by, s, rot: 0, sy: 0.97, recorte: "manos" },
    // tira de los brazos y asoma por encima, con los antebrazos apoyados
    { pose: "impulso", ancla: "borde", t: 2050, x: gx + 4, y: L.by + 7, s, recorte: "manos", crece: 0.55 },
    { pose: "impulso", ancla: "borde", t: 2250, x: gx + 5, y: L.by + 5, s, sy: 1.03, recorte: "manos" },
    // sube una pierna al borde
    // apoya una bota en el borde (la otra pierna queda por detrás del bocadillo)
    { pose: "sube", ancla: "pieAlto", t: 2650, x: gx + 4, y: L.by + 0.5, s, recorte: R, entra: [-4, 40] },
    { pose: "sube", ancla: "pieAlto", t: 2900, x: gx + 4, y: L.by + 0.5, s, rot: -1.5, recorte: R },
    // ya está arriba, junto al agujero; se agacha para coger impulso
    { pose: "agachada", ancla: "pies", t: 3150, x: gx + 22, y: L.by + 0.5, s, recorte: R },
    { pose: "agachada", ancla: "pies", t: 3350, x: gx + 22, y: L.by + 0.5, s, sy: 0.9, sx: 1.05, recorte: R },
    // ¡salta! y en el aire se va encogiendo, como si se alejara hacia el fondo
    { pose: "salta", ancla: "pies", t: 3650, x: L.hx + 14, y: L.by - 70, s: s * 0.8, sy: 1.04, recorte: "agujero", tramo: frena },
    // los pies llegan al agujero, ya tan pequeña que cabe entera
    { pose: "salta", ancla: "pies", t: 3950, x: pieFinX, y: L.hy - L.hr + 4, s: sFin, recorte: "agujero", tramo: acelera },
    // y se cuela del todo
    { pose: "salta", ancla: "pies", t: 4200, x: pieFinX, y: L.hy + L.hr + 4 + POSES.salta.h * sFin, s: sFin * 0.92, recorte: "agujero", tramo: acelera }
  ];
}

// 🕳️ recortes: «bocadillo» = lo que pasa por detrás del bocadillo no se ve, salvo la franja
// del borde de arriba (ahí se le ven las manos agarrando, por delante);
// «agujero» = por debajo del borde del agujero, solo se ve lo que pasa por el círculo
function recorte(tipo, L) {
  const A = 5000;
  if (tipo === "bocadillo" || tipo === "manos") {
    const y0 = L.by + (tipo === "manos" ? BANDA : 0);
    return `path(evenodd, "M-${A} -${A} H${A} V${A} H-${A} Z M${L.bx} ${y0} H${L.bx + L.bw} V${A} H${L.bx} Z")`;
  }
  if (tipo === "agujero") {
    const { hx, hy, hr } = L;
    return `path(evenodd, "M-${A} -${A} H${A} V${A} H-${A} Z M-${A} ${hy - hr} H${A} V${A} H-${A} Z M${hx - hr} ${hy} A ${hr} ${hr} 0 1 0 ${hx + hr} ${hy} A ${hr} ${hr} 0 1 0 ${hx - hr} ${hy} Z")`;
  }
  return "none";
}

// 👋 cuánto gira el brazo: saluda a ratos (al llegar y luego de vez en cuando)
function anguloSaludo(t) {
  const rafaga = (ini, dur) => {
    const k = (t - ini) / dur;
    if (k <= 0 || k >= 1) return 0;
    return Math.sin(Math.PI * k) * Math.sin(((t - ini) / 1000) * Math.PI * 2 * 1.7);
  };
  let v = rafaga(500, 2600);
  if (t > 3100) v += rafaga(3100 + Math.floor((t - 3100) / 5200) * 5200 + 1800, 2000);
  return v * 13;
}

export default function MaryPoses({ L, modo, onFin }) {
  const capaRef = useRef(null);
  const spritesRef = useRef({});
  const brazoRef = useRef(null);
  const manosRef = useRef(null);

  useEffect(() => {
    const claves = modo === "trepar" ? clavesTrepar(L) : clavesEntrada(L);
    const inicio = performance.now();
    const ultima = claves[claves.length - 1].t;
    let terminado = false;
    let id;

    function dibujar(nombre, c, opacidad, vida) {
      const el = spritesRef.current[nombre];
      if (!el) return;
      const rot = c.rot + (vida ? vida.rot : 0);
      const sy = c.sy * (vida ? vida.sy : 1);
      el.style.opacity = opacidad;
      el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${rot}deg) scale(${c.s * c.sx}, ${c.s * sy}) translate(${-c.ax}px, ${-c.ay}px)`;
    }

    function cuadro(ahora) {
      const bruto = ahora - inicio;
      const t = Math.min(bruto, ultima);
      let i = 0;
      while (i < claves.length - 1 && claves[i + 1].t <= t) i++;
      const a = claves[i];
      const b = claves[Math.min(i + 1, claves.length - 1)];
      const k = b === a ? 1 : (t - a.t) / (b.t - a.t);
      const ka = (b.tramo || suave)(k);

      // mientras espera: respira y se balancea un poquito
      const seg = ahora / 1000;
      const vida = modo === "entrada" && t >= ultima ? { rot: Math.sin(seg * 1.9) * 1.2, sy: 1 + Math.sin(seg * 3.1) * 0.007 } : null;

      const visibles = {};
      if (a.pose === b.pose) {
        visibles[a.pose] = { c: mezcla(colocacion(a), colocacion(b), ka), op: 1 };
      } else if (b.crece) {
        // la postura nueva sale estirándose hacia arriba desde su punto de apoyo (las manos en el borde)
        const cA = colocacion(a);
        const cB = colocacion(b);
        const kf = suave(Math.min(1, k / 0.25));
        visibles[a.pose] = { c: cA, op: 1 - kf };
        visibles[b.pose] = { c: { ...cB, sy: cB.sy * lerp(b.crece, 1, ka) }, op: kf };
      } else if (b.entra) {
        // la postura nueva aparece desde detrás del borde (como quien se aúpa) y la anterior se desvanece en su sitio
        const cA = colocacion(a);
        const cB = colocacion(b);
        const kf = suave(Math.min(1, k / 0.25));
        visibles[a.pose] = { c: cA, op: 1 - kf };
        visibles[b.pose] = { c: { ...cB, x: cB.x + b.entra[0] * (1 - ka), y: cB.y + b.entra[1] * (1 - ka) }, op: kf };
      } else {
        // la postura nueva se funde al final del tramo; las dos viajan juntas por su centro
        const inicioFundido = Math.max(0, 1 - FUNDIDO / (b.t - a.t));
        const kf = k < inicioFundido ? 0 : (k - inicioFundido) / (1 - inicioFundido);
        const cA = colocacion(a);
        const cB = colocacion(b);
        const ma = centro(cA, a.pose);
        const mb = centro(cB, b.pose);
        const m = [lerp(ma[0], mb[0], ka), lerp(ma[1], mb[1], ka)];
        const sA = lerp(1, cB.s / cA.s, ka * 0.5);
        const sB = lerp(cA.s / cB.s, 1, 0.5 + ka * 0.5);
        visibles[a.pose] = { c: { ...cA, s: cA.s * sA, x: cA.x + m[0] - ma[0], y: cA.y + m[1] - ma[1] }, op: 1 - suave(kf) };
        visibles[b.pose] = { c: { ...cB, s: cB.s * sB, x: cB.x + m[0] - mb[0], y: cB.y + m[1] - mb[1] }, op: suave(kf) };
      }
      Object.keys(POSES).forEach((n) => {
        if (visibles[n] && n !== "colgada") dibujar(n, visibles[n].c, visibles[n].op, vida);
        else if (spritesRef.current[n]) spritesRef.current[n].style.opacity = 0;
      });
      if (brazoRef.current) brazoRef.current.style.transform = `rotate(${modo === "entrada" ? anguloSaludo(bruto) : 0}deg) scale(1, 1.13)`;
      if (capaRef.current) capaRef.current.style.clipPath = recorte(t >= ultima ? b.recorte : b.entra ? b.recorte : a.recorte || b.recorte, L);

      // ✊ los dedos agarrados al borde: aparecen al cogerse y se van cuando se aúpa
      if (manosRef.current) {
        const op = modo === "trepar" ? Math.min(1, Math.max(0, (t - 700) / 120)) * (1 - Math.min(1, Math.max(0, (t - 1680) / 140))) : 0;
        const cg = visibles.colgada ? visibles.colgada.c.rot : 0;
        manosRef.current.style.opacity = op;
        manosRef.current.style.transform = `translate(${cg * 0.25}px, 0px)`;
      }

      if (modo === "trepar" && t >= ultima && !terminado) {
        terminado = true;
        onFin && onFin();
        return;
      }
      id = requestAnimationFrame(cuadro);
    }
    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
  }, [modo]); // eslint-disable-line react-hooks/exhaustive-deps

  const gx = L.bx + 64;
  const sep = 27.5 * L.s; // distancia de cada mano al centro del agarre (como en su dibujo)
  return (
    <>
    <div ref={manosRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0 }}>
      <Dedos x={gx - sep} y={L.by} s={L.s * 1.2} />
      <Dedos x={gx + sep} y={L.by} s={L.s * 1.2} espejo />
    </div>
    <div ref={capaRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Object.entries(POSES).map(([nombre, p]) => (
        <div
          key={nombre}
          ref={(el) => (spritesRef.current[nombre] = el)}
          style={{ position: "absolute", left: 0, top: 0, width: p.w, height: p.h, transformOrigin: "0 0", opacity: 0, willChange: "transform, opacity" }}
        >
          <img src={p.img} alt="" draggable={false} style={{ position: "absolute", left: 0, top: 0, width: p.w, height: p.h }} />
          {p.brazo && (
            <img
              ref={brazoRef}
              src={p.brazo.img}
              alt=""
              draggable={false}
              style={{ position: "absolute", left: 0, top: 0, width: p.w, height: p.h, transformOrigin: `${p.brazo.codo[0]}px ${p.brazo.codo[1]}px` }}
            />
          )}
          {p.extra && (
            <img
              src={p.extra.img}
              alt=""
              draggable={false}
              style={{ position: "absolute", left: p.extra.x, top: p.extra.y, width: p.extra.w, height: p.extra.h }}
            />
          )}
        </div>
      ))}
    </div>
    </>
  );
}

// ✋ una mano agarrada al borde, vista de frente: asoma un poquito el dorso por encima
// y los dedos doblados caen por delante del borde (mismo color de piel y trazo que su dibujo)
function Dedos({ x, y, s, espejo }) {
  const ancho = 19 * s;
  const largos = [6.4, 7.6, 7.3, 5.8]; // del índice al meñique
  const tinta = "#6a4a3c";
  return (
    <svg
      width={ancho}
      height={14 * s}
      viewBox="-1 -4.5 21 14"
      style={{ position: "absolute", left: x - ancho / 2, top: y - 4.5 * s, overflow: "visible", transform: espejo ? "scaleX(-1)" : "none" }}
    >
      {/* sombrita de los dedos sobre el bocadillo */}
      <path d="M2 1.2 C 6 9.6, 14 9.8, 17.6 1.2 Z" fill="rgba(90,60,40,0.16)" transform="translate(0.7,1.1)" />
      {/* dorso de la mano, asomando por detrás del borde */}
      <path d="M1.2 0.4 C 2.5 -3.4, 15.2 -4.2, 18.4 0.3 Z" fill="#f6d6bd" stroke={tinta} strokeWidth="0.55" strokeLinejoin="round" />
      {largos.map((l, i) => {
        const x0 = 1.4 + i * 4.15;
        return (
          <g key={i}>
            <path
              d={`M${x0} 0 C ${x0 - 0.15} ${l * 0.55}, ${x0 + 0.1} ${l}, ${x0 + 2.05} ${l} C ${x0 + 4.0} ${l}, ${x0 + 4.25} ${l * 0.55}, ${x0 + 4.1} 0 Z`}
              fill={i === 3 ? "#f3cfb4" : "#f8dbc4"}
              stroke={tinta}
              strokeWidth="0.55"
              strokeLinejoin="round"
            />
            {/* uña */}
            <path d={`M${x0 + 1.05} ${l - 2.1} C ${x0 + 1.2} ${l - 0.5}, ${x0 + 2.9} ${l - 0.5}, ${x0 + 3.05} ${l - 2.1} Z`} fill="#fbe7da" stroke={tinta} strokeWidth="0.3" />
            {/* pliegue del nudillo */}
            <path d={`M${x0 + 1.1} ${l * 0.36} Q ${x0 + 2.05} ${l * 0.44}, ${x0 + 3.0} ${l * 0.36}`} fill="none" stroke="#c99a80" strokeWidth="0.35" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}
