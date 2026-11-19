import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MANO } from "./Hub";
import { ANIMACIONES } from "./guiaAnimaciones";
import registroPersonajes from "../personajes/registroPersonajes";
import { obtenerPersonajeActivo } from "../personajes/personajeActivo";
import MaryPoses, { ALTO_POSE } from "./MaryPoses";
import maryCara from "../assets/kit/mary/mary-cara-guia.png";

// 🧭 VISITA GUIADA: tu personaje te enseña la app pantalla a pantalla.
// Cada paso dice en qué pantalla está, qué parte ilumina (data-guia="…")
// y, si hace falta, que la persona pulse ella misma para seguir.
export const CLAVE_VISITA = "opo_visita_guiada_v1";

function pasos(nombre) {
  return [
    // 👋 bienvenida
    { seccion: "Bienvenida", pantalla: "inicio", presentacion: true, texto: <>¡Hola! Soy <b>{nombre}</b> y te voy a ayudar a conocer tu herramienta. ¡Pínchame para empezar!</> },
    {
      seccion: "Bienvenida",
      pantalla: "inicio",
      texto: (
        <>
          <b>Insistentes Sociales</b> es tu herramienta para preparar la oposición de Trabajo Social: maneras diferentes de estudiar,
          test como los del examen y repasar jugando.
          <span style={{ display: "block", marginTop: 10 }}>
            Está hecha por una Insistente Trabajadora Social para más Insistentes Sociales, para que estudiar sea ameno y divertido.
          </span>
        </>
      )
    },
    {
      seccion: "Bienvenida",
      pantalla: "inicio",
      guia: "barra",
      texto: (
        <>
          Abajo tienes la barra con las cinco secciones. Dentro de un test, un juego o un examen se esconde: para volver a Inicio,
          pulsa la <b>casita</b>.
        </>
      )
    },
    // 🏠 inicio
    {
      seccion: "Inicio",
      pantalla: "inicio",
      guia: "hoy",
      texto: (
        <>
          Aquí ves <b>qué toca hoy</b> según tu calendario. La llamita cuenta los días seguidos que llevas, y los días libres o de
          vacaciones que tengas marcados no la rompen.
        </>
      )
    },
    {
      seccion: "Inicio",
      pantalla: "inicio",
      guia: "racion",
      texto: (
        <>
          <b>Tu ración de hoy</b>: unos 15–20 minutos según el día. En función de lo que hayas puesto en tu calendario, te aparecerán
          tareas para estudiar y repasar. Y si es tu día libre, ¡te toca descansar!
        </>
      )
    },
    {
      seccion: "Inicio",
      pantalla: "inicio",
      guia: "personalizar",
      texto: (
        <>
          Con <b>Personalizar</b> añades o quitas tareas para hacerla a tu gusto. Cada tarea terminada se sella con HECHO y, al
          completarla, el día se marca solo en tu calendario.
        </>
      )
    },
    {
      seccion: "Inicio",
      pantalla: "inicio",
      guia: "jardin",
      anim: "planta",
      texto: (
        <>
          Tu planta es la de <b>tu semana</b>: cada día cumplido le sale una hoja y, si cumples los siete, el domingo florece. El
          lunes vuelve a ser semilla. Debajo, «Para reforzar» te dice el bloque en el que más fallas.
        </>
      )
    },
    {
      seccion: "Inicio",
      pantalla: "inicio",
      guia: "buzon",
      texto: (
        <>
          El sobre es tu <b>buzón</b>: ahí llegan los hechizos de tus compis. Si tiene un puntito, hay algo nuevo.
        </>
      )
    },
    // 📖 estudiar
    { seccion: "Estudiar", pantalla: "inicio", guia: "tab-estudiar", toque: "estudiar", texto: <>Ahora pulsa en <b>Estudiar</b>.</> },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      texto: (
        <>
          <b>Estudiar</b> son diferentes métodos para memorizar y recordar el temario: para que se te quede de verdad, no solo para
          reconocerlo en un test.
        </>
      )
    },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      guia: "explora",
      texto: (
        <>
          <b>Explora la Constitución</b>: recórrela como si fuera un edificio. Cada Título es una sala y, dentro, vas abriendo sus
          Capítulos y Secciones hasta llegar a cada artículo. Así te aprendes dónde está cada cosa.
        </>
      )
    },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      guia: "explora",
      anim: "llave",
      texto: (
        <>
          Una vez al día, cada sala está <b>cerrada con llave</b>: para abrirla, escribe de qué artículo a qué artículo va y pulsa
          Comprobar. Si fallas, al segundo intento te da una pista y al tercero puedes ver la respuesta.
        </>
      )
    },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      guia: "explora",
      texto: (
        <>
          Cuando llegas a un artículo, lo lees y, con <b>Practicar este artículo</b>, lo memorizas en Erre que erre para comprobar si
          te lo has aprendido.
        </>
      )
    },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      guia: "erre",
      anim: "erre",
      texto: (
        <>
          <b>Erre que erre</b>: memoriza un artículo y rellena lo que falta. Cada ficha tiene tres niveles y sube cuando la aciertas
          a la primera.
        </>
      )
    },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      guia: "construye",
      texto: (
        <>
          <b>Construye la Constitución</b>: escribe con qué artículo empieza y termina cada parte, y vuelve a levantar el edificio
          planta a planta. Tu personaje te echa una mano: si una planta se te resiste tres veces, te ofrece pistas.
        </>
      )
    },
    { seccion: "Estudiar", pantalla: "estudiar", guia: "conecta", texto: <><b>Conecta la Constitución</b>: une cada artículo con lo que dice.</> },
    {
      seccion: "Estudiar",
      pantalla: "estudiar",
      guia: "tarjetero",
      texto: (
        <>
          <b>Tarjetero</b>: tus propios resúmenes, en carpetas con el nombre que quieras. Solo los ves tú.
        </>
      )
    },
    // 📝 test
    { seccion: "Test", pantalla: "estudiar", guia: "tab-test", toque: "test", texto: <>Ahora pulsa en <b>Test</b>.</> },
    {
      seccion: "Test",
      pantalla: "test",
      guia: "repaso",
      texto: (
        <>
          <b>Repaso</b>: por bloques o general, con las preguntas que quieras. Te salen primero las que menos te han salido, así que
          acabas recorriendo todo el banco. Si lo dejas a medias, lo guardas y sigues otro día.
        </>
      )
    },
    {
      seccion: "Test",
      pantalla: "test",
      guia: "simulacro",
      texto: (
        <>
          <b>Simulacro oficial</b>: 100 preguntas, como el día del examen. Al terminar ves tu nota, cómo vas por bloques y repasas
          las que fallaste.
        </>
      )
    },
    {
      seccion: "Test",
      pantalla: "test",
      guia: "errores",
      anim: "carpetas",
      texto: (
        <>
          Cada pregunta que fallas va a <b>Repasar errores</b>: primero es prioritaria, con un acierto pasa a seguimiento y con otro
          queda resuelta. Si la vuelves a fallar, vuelve al principio.
        </>
      )
    },
    {
      seccion: "Test",
      pantalla: "test",
      guia: "favoritas",
      texto: (
        <>
          <b>Favoritas</b>: las preguntas que guardas durante un test. Y si ves que alguna pregunta está mal, <b>impúgnala</b> desde
          la propia pregunta: la respuesta te saldrá en Mi expediente.
        </>
      )
    },
    // 🎲 juegos
    { seccion: "Juegos", pantalla: "test", guia: "tab-minijuegos", toque: "minijuegos", texto: <>¿Y si jugamos? Pulsa en <b>Juegos</b>.</> },
    {
      seccion: "Juegos",
      pantalla: "minijuegos",
      guia: "carrera",
      texto: (
        <>
          <b>Carrera por la Plaza</b>: compite con 2 a 4 personas, en un solo móvil o cada persona desde el suyo. Para jugar online,
          alguien crea la sala y comparte el código con el resto. ¡A ver quién llega antes a la meta!
        </>
      )
    },
    {
      seccion: "Juegos",
      pantalla: "minijuegos",
      guia: "salva",
      texto: (
        <>
          <b>Salva a tu trabajadora social</b>: la burocracia quiere acabar con Mary Richmond, pero tú puedes salvarla. ¿Serás capaz?
          Las preguntas que falles irán también a tus repasos.
        </>
      )
    },
    // 🗂️ expediente
    { seccion: "Mi expediente", pantalla: "minijuegos", guia: "tab-expediente", toque: "expediente", texto: <>Por último, pulsa en <b>Expediente</b>.</> },
    {
      seccion: "Mi expediente",
      pantalla: "expediente",
      guia: "evolucion",
      texto: (
        <>
          <b>Evolución</b>: tus aciertos y fallos, en general y por bloques. Te dice dónde poner el esfuerzo, y de aquí sale el «Para
          reforzar» de Inicio.
        </>
      )
    },
    {
      seccion: "Mi expediente",
      pantalla: "expediente",
      guia: "calendario",
      anim: "calendario",
      texto: (
        <>
          <b>Calendario</b>: organizarte es clave para estudiar. Planificar te ayuda a repartir el temario, repasar a tiempo y llegar
          al examen sin agobios. Marca cada día con su letra y se marcará como hecho solo cuando completes tu ración.
        </>
      )
    },
    {
      seccion: "Mi expediente",
      pantalla: "expediente",
      guia: "compis",
      texto: (
        <>
          <b>Mis compis</b>: una parte importante es nuestra comunidad. Lanza hechizos mágicos a tus compis y, cuando necesites
          apoyo, pide un empujón con «¿Hoy te cuesta?».
        </>
      )
    },
    {
      seccion: "Mi expediente",
      pantalla: "expediente",
      guia: "perfil",
      texto: (
        <>
          En <b>Perfil</b> están tu cuenta, tu nombre en la app y tu código de compi. Y en «Instrucciones» puedes volver a ver esta
          visita cuando quieras.
        </>
      )
    },
    {
      seccion: "Tu personaje",
      pantalla: "expediente",
      guia: "personaje",
      accion: "tocar",
      texto: <>Y a mí me encontrarás siempre aquí. Tócame (con cariño, ¿eh?, que no hace falta romper la pantalla) y te cuento algo.</>
    },
    {
      seccion: "Tu personaje",
      pantalla: "expediente",
      guia: "personaje",
      accion: "arrastrar",
      texto: <>¿Ves? Siempre tengo algo que contarte. Y si te molesto, arrástrame a otro sitio de la pantalla. ¡Prueba!</>
    },
    { seccion: "¡Al lío!", pantalla: "inicio", texto: <>¡Ya lo tienes todo! Un poquito cada día: insistentes, pero sin agobios.</> }
  ];
}

const cssGuia = `
  @keyframes guiaPlop { 0% { transform: scale(0.4); } 60% { transform: scale(1.35); } 100% { transform: scale(1); } }
  @keyframes guiaTiembla { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
  @keyframes guiaSube { 0% { transform: translate(-50%, 130%); } 70% { transform: translate(-50%, -6%); } 100% { transform: translate(-50%, 0); } }
  @keyframes guiaBocadillo { 0% { opacity: 0; transform: scale(0.6); } 70% { opacity: 1; transform: scale(1.04); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes guiaAparece { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes guiaLatido { 0%, 100% { box-shadow: 0 0 0 9999px rgba(52,44,36,0.55), 0 0 0 0 rgba(242,203,143,0.9); } 50% { box-shadow: 0 0 0 9999px rgba(52,44,36,0.55), 0 0 0 8px rgba(242,203,143,0.45); } }
`;

export default function GuiaVisita({ paso, setPaso, pantalla, irA, onFin }) {
  const personaje = registroPersonajes[obtenerPersonajeActivo()] || registroPersonajes["ander-egg"] || {};
  const lista = pasos(personaje.nombre || "tu personaje");
  const p = lista[Math.min(paso, lista.length - 1)];
  const ultimo = paso >= lista.length - 1;
  const [rect, setRect] = useState(null);
  const [alturaBocadillo, setAlturaBocadillo] = useState(220);
  const [modoMary, setModoMary] = useState("entrada"); // "entrada" (sube y saluda) | "trepar" (se mete en el bocadillo)
  const [deEntrada, setDeEntrada] = useState(false); // el bocadillo viaja de su sitio junto a Mary a su sitio normal
  const [recienLlegada, setRecienLlegada] = useState(false); // «¡plop!» al aparecer en el círculo
  const bocadilloRef = useRef(null);
  const avatarRef = useRef(null);

  // Mary sale de cuerpo entero (marioneta); con otro personaje, su foto
  const esMary = (personaje.nombre || "").includes("Mary");
  const fotoCirculo = esMary ? maryCara : personaje.foto;
  const estiloFotoCirculo = { width: "100%", height: "100%", objectFit: "cover" };

  // 🧭 llevar a la pantalla del paso (o avanzar si la persona ha pulsado donde tocaba)
  useEffect(() => {
    if (p.toque && pantalla === p.toque) {
      setPaso(paso + 1);
      return;
    }
    if (pantalla !== p.pantalla) irA(p.pantalla);
  }, [paso, pantalla]); // eslint-disable-line react-hooks/exhaustive-deps

  // al volver a la presentación, Mary vuelve a empezar
  useEffect(() => {
    if (p.presentacion) {
      setModoMary("entrada");
    }
  }, [paso]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔦 medir lo que se ilumina
  useLayoutEffect(() => {
    setRect(null);
    if (!p.guia || pantalla !== p.pantalla) return;
    let vivo = true;
    let intentos = 0;
    function medir() {
      if (!vivo) return;
      const el = document.querySelector(`[data-guia="${p.guia}"]`);
      if (!el) {
        if (intentos++ < 30) requestAnimationFrame(medir);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "auto" });
      requestAnimationFrame(() => {
        if (!vivo) return;
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
      });
    }
    medir();
    const alCambiar = () => {
      intentos = 0;
      medir();
    };
    window.addEventListener("resize", alCambiar);
    return () => {
      vivo = false;
      window.removeEventListener("resize", alCambiar);
    };
  }, [paso, pantalla]); // eslint-disable-line react-hooks/exhaustive-deps

  // 📏 altura real del bocadillo (para que nunca se salga de la pantalla)
  useLayoutEffect(() => {
    if (bocadilloRef.current) setAlturaBocadillo(bocadilloRef.current.offsetHeight);
  });

  // 👆 pasos en los que hay que tocar o arrastrar al personaje
  useEffect(() => {
    if (!p.accion) return;
    let inicio = null;
    let temporizador = null;
    const enPersonaje = (e) => e.target.closest && e.target.closest('[data-guia="personaje"]');
    function abajo(e) {
      if (enPersonaje(e)) inicio = { x: e.clientX, y: e.clientY };
    }
    function mover() {
      if (!inicio) return;
      const el = document.querySelector('[data-guia="personaje"]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    }
    function arriba(e) {
      if (!inicio) return;
      const distancia = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y);
      inicio = null;
      if (p.accion === "tocar" && distancia < 10) temporizador = setTimeout(() => setPaso(paso + 1), 1800);
      if (p.accion === "arrastrar" && distancia > 40) temporizador = setTimeout(() => setPaso(paso + 1), 600);
    }
    window.addEventListener("pointerdown", abajo, true);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", arriba, true);
    return () => {
      clearTimeout(temporizador);
      window.removeEventListener("pointerdown", abajo, true);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", arriba, true);
    };
  }, [paso]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🎎 Mary ya está dentro del bocadillo: aparece en el círculo y el bocadillo se va a su sitio
  function maryDentro() {
    setRecienLlegada(true);
    setDeEntrada(true);
    setTimeout(() => setRecienLlegada(false), 700);
    setTimeout(() => setDeEntrada(false), 900);
    setPaso(paso + 1);
  }

  function pincharPersonaje() {
    if (!p.presentacion) return;
    if (esMary) {
      if (modoMary === "entrada") setModoMary("trepar");
    } else {
      maryDentro();
    }
  }

  function siguiente() {
    if (ultimo) return onFin();
    setPaso(paso + 1);
  }

  const Anim = p.anim ? ANIMACIONES[p.anim] : null;
  const ancho = window.innerWidth;
  const alto = window.innerHeight;

  // 📐 escena de la presentación: dónde está Mary y dónde su bocadillo
  const margen = Math.max(0, (ancho - 420) / 2);
  const sMary = Math.min(1, (alto * 0.4) / ALTO_POSE);
  const L = { H: alto, s: sMary, wx: margen + 70 * Math.min(1, ancho / 390), suelo: alto - 22 };
  // el bocadillo, justo a su alcance cuando se estira (sus manos llegan al borde)
  L.bx = L.wx + 83 * sMary - 16;
  L.by = L.suelo - 296.5 * sMary + 6;
  L.bw = Math.min(ancho - L.bx - 12, 250);
  L.bh = alturaBocadillo;
  L.hr = 18; // el agujero: el círculo de la foto, dentro del bocadillo
  L.hx = L.bx + 16 + 20;
  L.hy = L.by + 14 + 20;

  let estiloSitio;
  if (p.presentacion) {
    estiloSitio = esMary
      ? { left: L.bx, top: L.by, width: L.bw, transform: "none" }
      : { left: "50%", top: Math.max(12, alto - 170 - 50 - alturaBocadillo), width: "min(350px, calc(100vw - 28px))", transform: "translateX(-50%)" };
  } else {
    let top;
    if (!rect) {
      top = (alto - alturaBocadillo) / 2;
    } else {
      const encima = rect.top + rect.height / 2 > alto * 0.5; // el bocadillo va al otro lado de lo iluminado
      top = encima ? rect.top - 12 - alturaBocadillo : rect.top + rect.height + 12;
    }
    top = Math.max(12, Math.min(alto - alturaBocadillo - 12, top));
    estiloSitio = { left: "50%", top, width: "min(350px, calc(100vw - 28px))", transform: "translateX(-50%)" };
  }

  // zonas que bloquean los toques (dejan libre lo iluminado cuando hay que pulsarlo)
  const bloqueos = rect && (p.toque || p.accion)
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, rect.top) },
        { top: rect.top + rect.height, left: 0, right: 0, bottom: 0 },
        { top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height },
        { top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }
      ]
    : [{ inset: 0 }];

  const comic = p.presentacion && esMary; // en la presentación, el bocadillo sale de Mary

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: "none", userSelect: "none", WebkitUserSelect: "none", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style>{cssGuia}</style>
      {p.accion && <style>{'[data-guia="personaje"] { z-index: 90 !important; }'}</style>}

      {/* fondo oscurecido con el hueco de lo que se explica */}
      {rect ? (
        <div
          style={{
            position: "fixed",
            ...rect,
            borderRadius: 20,
            boxShadow: "0 0 0 9999px rgba(52,44,36,0.55)",
            transition: "top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease",
            animation: p.toque ? "guiaLatido 1.4s ease-in-out infinite" : undefined
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(52,44,36,0.55)" }} />
      )}
      {bloqueos.map((b, i) => (
        <div key={i} style={{ position: "fixed", ...b, pointerEvents: "auto" }} />
      ))}

      {/* 🎎 presentación: Mary de cuerpo entero (delante del bocadillo hasta que se mete dentro) */}
      {p.presentacion && esMary && (
        <div style={{ position: "fixed", inset: 0, zIndex: 6, pointerEvents: "none" }}>
          <MaryPoses L={L} modo={modoMary} onFin={maryDentro} />
          {modoMary === "entrada" && (
            <div
              onClick={pincharPersonaje}
              role="button"
              aria-label={`${personaje.nombre}: pínchame para empezar`}
              style={{
                position: "absolute",
                left: L.wx - 62 * L.s,
                top: L.suelo - ALTO_POSE * L.s,
                width: 124 * L.s,
                height: ALTO_POSE * L.s,
                cursor: "pointer",
                pointerEvents: "auto"
              }}
            />
          )}
        </div>
      )}
      {p.presentacion && !esMary && (
        <div
          onClick={pincharPersonaje}
          role="button"
          aria-label={`${personaje.nombre}: pínchame para empezar`}
          style={{
            position: "fixed",
            left: "50%",
            bottom: 28,
            width: 170,
            height: 170,
            borderRadius: "50%",
            overflow: "hidden",
            border: "5px solid #fdfaf4",
            boxSizing: "border-box",
            background: "#e9dff3",
            zIndex: 6,
            cursor: "pointer",
            pointerEvents: "auto",
            animation: "guiaSube 0.9s cubic-bezier(.3,1.2,.5,1) both"
          }}
        >
          {personaje.foto && <img src={personaje.foto} alt={personaje.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
      )}

      {/* 💬 bocadillo del personaje */}
      <div
        style={{
          position: "fixed",
          zIndex: 5,
          ...estiloSitio,
          pointerEvents: modoMary === "trepar" && p.presentacion ? "none" : "auto",
          transition: deEntrada ? "top 0.7s ease, left 0.7s ease, width 0.7s ease, transform 0.7s ease" : "none"
        }}
      >
        <div
          key={paso <= 1 ? "entrada" : paso}
          ref={bocadilloRef}
          style={{
            position: "relative",
            background: "#fdfaf4",
            borderRadius: comic ? 30 : 24,
            padding: "14px 16px 12px",
            boxSizing: "border-box",
            boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
            color: "#4a463f",
            transformOrigin: comic ? "0% 30%" : "50% 50%",
            animation: comic ? "guiaBocadillo 0.45s ease 1.1s both" : paso <= 1 ? undefined : "guiaAparece 0.35s ease both"
          }}
        >
          {/* piquito del bocadillo, apuntando a la cara de Mary */}
          {comic && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: -9,
                top: 46,
                width: 22,
                height: 22,
                background: "#fdfaf4",
                transform: "rotate(45deg) skew(8deg, 8deg)",
                borderRadius: 4
              }}
            />
          )}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {/* el hueco de la foto (en la presentación está vacío: Mary se mete en él) */}
            <span
              ref={avatarRef}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                overflow: "hidden",
                background: p.presentacion ? "radial-gradient(circle at 50% 40%, #6e5f73 0%, #9b8aa0 55%, #d9cde3 100%)" : "#e9dff3",
                boxShadow: p.presentacion ? "inset 0 4px 8px rgba(0,0,0,0.35)" : "none",
                flexShrink: 0,
                border: p.presentacion ? "2px solid #cdbfae" : "none",
                boxSizing: "border-box",
                animation: recienLlegada ? "guiaPlop 0.6s cubic-bezier(.3,1.6,.5,1) both" : undefined
              }}
            >
              {!p.presentacion && fotoCirculo && <img src={fotoCirculo} alt="" style={estiloFotoCirculo} />}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", ...MANO, fontSize: 22, lineHeight: 1, color: "#5b4a3a" }}>{p.seccion}</span>
              <span style={{ display: "block", fontSize: 11, color: "#8a8070" }}>
                {paso + 1} de {lista.length}
              </span>
            </span>
            {!ultimo && (
              <button
                onClick={onFin}
                style={{ border: "none", background: "transparent", color: "#8a7d6f", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
              >
                Saltar
              </button>
            )}
          </div>

          {/* barrita de progreso */}
          <div style={{ position: "relative", height: 4, borderRadius: 4, background: "#efe6d8", marginBottom: 10, overflow: "hidden" }}>
            <div style={{ width: `${((paso + 1) / lista.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #d9cdf0, #f3cdd2)", transition: "width 0.3s ease" }} />
          </div>

          {Anim && <Anim />}

          <p style={{ position: "relative", margin: "0 0 12px", fontSize: comic ? 13.5 : 14, lineHeight: 1.5 }}>{p.texto}</p>

          <div style={{ position: "relative", display: "flex", gap: 8, alignItems: "center" }}>
            {paso > 0 && (
              <button
                onClick={() => setPaso(paso - 1 - (lista[paso - 1].toque ? 1 : 0))}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 16,
                  padding: "10px",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  color: "#5b4a3a",
                  background: "#f3ede3",
                  cursor: "pointer"
                }}
              >
                Anterior
              </button>
            )}
            {p.presentacion ? (
              <span style={{ flex: 2, textAlign: "center", fontSize: 12.5, color: "#8a6a4f" }}>
                Pincha a {(personaje.nombre || "tu personaje").split(" ")[0]} ✨
              </span>
            ) : p.toque || p.accion ? (
              <span style={{ flex: 2, textAlign: "center", fontSize: 12.5, color: "#8a6a4f" }}>
                {p.accion === "tocar" ? "Toca al personaje ✨" : p.accion === "arrastrar" ? "Arrástralo ✨" : "Pulsa donde brilla ✨"}
              </span>
            ) : (
              <button
                onClick={siguiente}
                style={{
                  flex: 2,
                  border: "none",
                  borderRadius: 16,
                  padding: "10px",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  color: "#5a4636",
                  background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
                  cursor: "pointer"
                }}
              >
                {ultimo ? "¡Vamos al lío!" : "Siguiente"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
