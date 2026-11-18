import { useEffect, useRef, useState } from "react";
import mary0 from "../assets/kit/salva/mary-0.png";
import mary1 from "../assets/kit/salva/mary-1.png";
import mary2 from "../assets/kit/salva/mary-2.png";
import mary3 from "../assets/kit/salva/mary-3.png";
import libros0 from "../assets/kit/salva/libros-0.png";
import libros1 from "../assets/kit/salva/libros-1.png";
import libros2 from "../assets/kit/salva/libros-2.png";
import libros3 from "../assets/kit/salva/libros-3.png";
import imagenDerrota from "../assets/trabajadora-derrota.png";

// 📚 Mary Richmond y su montaña de papeles, en dos capas: ella y los libros encima.
// base = punto donde la pila se apoya (x, y en %): es el eje sobre el que se tambalea.
// centro = altura (en %) desde donde salen volando las hojas.
// vaiven = cuánto se balancea la pila (más libros, más inestable).
const ETAPAS = [
  { mary: mary0, libros: libros0, base: [49.1, 52.4], centro: 28, vaiven: 1.6 },
  { mary: mary1, libros: libros1, base: [51.0, 37.0], centro: 22, vaiven: 1.1 },
  { mary: mary2, libros: libros2, base: [51.7, 34.4], centro: 22, vaiven: 0.7 },
  { mary: mary3, libros: libros3, base: [50.2, 27.1], centro: 18, vaiven: 0.35 }
];
const ANCHO = 260; // ancho máximo de la escena en px

// 🖼️ todo se prepara al cargar, para que ningún cambio de etapa aparezca a medias
[mary0, mary1, mary2, mary3, libros0, libros1, libros2, libros3, imagenDerrota].forEach((src) => {
  const img = new Image();
  img.src = src;
});

const cssEscena = `
  .mary-vaiven { animation: maryVaiven 3.4s ease-in-out infinite; }
  @keyframes maryVaiven {
    0%, 100% { transform: rotate(calc(var(--vaiven) * -1deg)); }
    50% { transform: rotate(calc(var(--vaiven) * 1deg)); }
  }
  .mary-libros-entra { animation: maryAsentar 0.8s ease-out both; }
  @keyframes maryAsentar { from { opacity: 0; transform: translateY(-5%); } to { opacity: 1; transform: none; } }
  .mary-libros-sale { animation: marySubir 1s cubic-bezier(0.5, 0, 0.75, 0.6) forwards; }
  @keyframes marySubir { to { opacity: 0; transform: translateY(-26%) rotate(-7deg) scale(0.92); } }
  .mary-aparece { animation: maryAparece 0.7s ease both; }
  @keyframes maryAparece { from { opacity: 0; } to { opacity: 1; } }
  .mary-desaparece { animation: maryDesaparece 0.7s ease forwards; }
  @keyframes maryDesaparece { to { opacity: 0; } }
  .mary-hoja { animation: maryHoja var(--dura, 1.3s) cubic-bezier(0.25, 0.6, 0.4, 1) forwards; }
  @keyframes maryHoja {
    0% { opacity: 0; transform: translate(-50%, -50%) rotate(0deg); }
    12% { opacity: 1; }
    100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot)); }
  }
`;

const capa = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" };
const azar = (min, max) => min + Math.random() * (max - min);

/**
 * Escena animada de "Salva a tu trabajadora social".
 * - aciertos: cada 5 aciertos la pila se aligera (los libros que sobran salen volando).
 * - evento: { tipo: "acierto" | "fallo" | "derrota", id } — cambia el id para lanzarlo.
 * - onDerrumbe: se llama cuando termina la animación de derrota.
 */
export default function EscenaMary({ aciertos, total = 20, evento, onDerrumbe }) {
  const etapaActual = aciertos >= total ? 4 : Math.min(3, Math.floor(aciertos / 5));
  const [vista, setVista] = useState({ etapa: etapaActual, anterior: null, clave: 0 });
  const [hojas, setHojas] = useState([]);
  const [aplastada, setAplastada] = useState(false);
  const librosRef = useRef(null);
  const maryRef = useRef(null);
  const idHoja = useRef(0);
  const alDerrumbe = useRef(onDerrumbe);
  alDerrumbe.current = onDerrumbe;

  // 📉 la pila cambia de etapa: lo que sobra se va volando y Mary se va irguiendo
  useEffect(() => {
    if (etapaActual === vista.etapa) return;
    setVista((v) => ({ etapa: etapaActual, anterior: v.etapa, clave: v.clave + 1 }));
    const id = setTimeout(() => setVista((v) => ({ ...v, anterior: null })), 1100);
    return () => clearTimeout(id);
  }, [etapaActual]); // eslint-disable-line react-hooks/exhaustive-deps

  function soltarHojas(cuantas, { abajo = false, desde } = {}) {
    const e = ETAPAS[Math.min(vista.etapa, 3)];
    const nuevas = Array.from({ length: cuantas }, () => ({
      id: ++idHoja.current,
      x: e.base[0] + azar(-8, 8),
      y: desde ?? e.centro + azar(-5, 5),
      dx: `${azar(-320, 320)}%`,
      dy: abajo ? `${azar(420, 620)}%` : `${azar(-380, -180)}%`,
      rot: `${azar(-140, 140)}deg`,
      dura: `${azar(1.1, 1.6)}s`
    }));
    setHojas((h) => [...h, ...nuevas]);
    const ids = nuevas.map((n) => n.id);
    setTimeout(() => setHojas((h) => h.filter((x) => !ids.includes(x.id))), 1800);
  }

  // 🎬 lo que pasa en cada respuesta
  useEffect(() => {
    if (!evento) return;
    const libros = librosRef.current;
    const mary = maryRef.current;
    const timers = [];

    if (evento.tipo === "acierto") {
      soltarHojas(3);
      libros && libros.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-2.5%)" }, { transform: "translateY(0)" }],
        { duration: 650, easing: "ease-in-out" }
      );
      mary && mary.animate(
        [{ transform: "scaleY(1)" }, { transform: "scaleY(1.015)" }, { transform: "scaleY(1)" }],
        { duration: 650, easing: "ease-in-out" }
      );
    }

    if (evento.tipo === "fallo") {
      // casi se cae: la pila se tambalea, se escapa una hoja y Mary se encoge del susto
      libros && libros.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-6deg)" },
          { transform: "rotate(5deg)" },
          { transform: "rotate(-3deg)" },
          { transform: "rotate(1.5deg)" },
          { transform: "rotate(0deg)" }
        ],
        { duration: 1100, easing: "ease-in-out" }
      );
      mary && mary.animate(
        [{ transform: "scaleY(1)" }, { transform: "scaleY(0.95)" }, { transform: "scaleY(1)" }],
        { duration: 700, easing: "ease-out" }
      );
      soltarHojas(2, { abajo: true });
    }

    if (evento.tipo === "derrota") {
      // la pila se tambalea cada vez más… y se le cae encima
      libros && libros.animate(
        [
          { transform: "rotate(0deg) translateY(0)", offset: 0 },
          { transform: "rotate(-5deg) translateY(0)", offset: 0.22 },
          { transform: "rotate(6deg) translateY(0)", offset: 0.44 },
          { transform: "rotate(-3deg) translateY(-2%)", offset: 0.6 },
          { transform: "rotate(9deg) translateY(30%)", offset: 1 }
        ],
        { duration: 1500, easing: "cubic-bezier(0.55, 0, 0.85, 0.4)", fill: "forwards" }
      );
      mary && mary.animate(
        [
          { transform: "scaleY(1)", offset: 0 },
          { transform: "scaleY(0.97)", offset: 0.5 },
          { transform: "scaleY(0.97)", offset: 0.85 },
          { transform: "scaleY(0.8)", offset: 1 }
        ],
        { duration: 1500, easing: "ease-in", fill: "forwards" }
      );
      timers.push(setTimeout(() => {
        setAplastada(true);
        soltarHojas(7, { desde: 62 });
      }, 1380));
      timers.push(setTimeout(() => alDerrumbe.current && alDerrumbe.current(), 2600));
    }

    return () => timers.forEach(clearTimeout);
  }, [evento?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { etapa, anterior, clave } = vista;
  const actual = ETAPAS[Math.min(etapa, 3)];
  const previa = anterior !== null ? ETAPAS[Math.min(anterior, 3)] : null;
  const origen = (e) => `${e.base[0]}% ${e.base[1]}%`;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: ANCHO, aspectRatio: "2 / 3", margin: "0 auto" }}>
      <style>{cssEscena}</style>

      {/* Mary (la anterior se funde mientras aparece la nueva) */}
      <div
        ref={maryRef}
        style={{ position: "absolute", inset: 0, transformOrigin: "50% 92%", opacity: aplastada ? 0 : 1, transition: "opacity 0.3s ease" }}
      >
        {previa && previa.mary !== actual.mary && (
          <img src={previa.mary} alt="" className="mary-desaparece" style={capa} />
        )}
        <img
          key={`mary-${clave}`}
          src={actual.mary}
          alt="Mary Richmond"
          className={clave && previa && previa.mary !== actual.mary ? "mary-aparece" : ""}
          style={capa}
        />
      </div>

      {/* la pila que sobra sale volando */}
      {previa && (
        <div className="mary-libros-sale" style={{ position: "absolute", inset: 0, transformOrigin: origen(previa) }}>
          <img src={previa.libros} alt="" style={capa} />
        </div>
      )}

      {/* la pila actual, balanceándose */}
      {etapa < 4 && (
        <div
          key={`libros-${clave}`}
          className={clave ? "mary-libros-entra" : ""}
          style={{ position: "absolute", inset: 0, transformOrigin: origen(actual), opacity: aplastada ? 0 : 1, transition: "opacity 0.3s ease" }}
        >
          <div ref={librosRef} style={{ position: "absolute", inset: 0, transformOrigin: origen(actual) }}>
            <div
              className="mary-vaiven"
              style={{ position: "absolute", inset: 0, transformOrigin: origen(actual), "--vaiven": actual.vaiven }}
            >
              <img src={actual.libros} alt="" style={capa} />
            </div>
          </div>
        </div>
      )}

      {/* aplastada: la imagen de la derrota aparece justo cuando la pila cae */}
      {aplastada && <img src={imagenDerrota} alt="" className="mary-aparece" style={{ ...capa, animationDuration: "0.35s" }} />}

      {/* hojas sueltas */}
      {hojas.map((h) => (
        <div
          key={h.id}
          className="mary-hoja"
          style={{
            position: "absolute",
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: "9%",
            aspectRatio: "3 / 4",
            background: "#fbf6ec",
            backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 22%, rgba(120,100,70,0.35) 22% 27%)",
            backgroundSize: "68% 70%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            border: "1px solid rgba(90,70,50,0.45)",
            borderRadius: 2,
            pointerEvents: "none",
            "--dx": h.dx,
            "--dy": h.dy,
            "--rot": h.rot,
            "--dura": h.dura
          }}
        />
      ))}
    </div>
  );
}