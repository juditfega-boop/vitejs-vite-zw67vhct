import { useEffect, useLayoutEffect, useState } from "react";
import { MANO } from "./Hub";
import { ANIMACIONES } from "./guiaAnimaciones";
import registroPersonajes from "../personajes/registroPersonajes";
import { obtenerPersonajeActivo } from "../personajes/personajeActivo";

// 🧭 VISITA GUIADA: tu personaje te enseña la app pantalla a pantalla.
// Cada paso dice en qué pantalla está, qué parte ilumina (data-guia="…")
// y, si hace falta, que la persona pulse ella misma para seguir.
export const CLAVE_VISITA = "opo_visita_guiada_v1";

function pasos(nombre) {
  return [
    // 👋 bienvenida
    { seccion: "Bienvenida", pantalla: "inicio", texto: <>¡Hola! Soy <b>{nombre}</b> y te voy a enseñar tu herramienta.</> },
    {
      seccion: "Bienvenida",
      pantalla: "inicio",
      texto: (
        <>
          <b>Insistentes Sociales</b> es tu herramienta para preparar la oposición de Trabajo Social: maneras diferentes de estudiar,
          test como los del examen y repaso jugando. Está hecha por una insistente trabajadora social para más insistentes sociales,
          para que estudiar sea ameno y divertido.
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
          <b>Tu ración de hoy</b>: unos 15–20 minutos según el día. Estudio: Erre que erre y Explora. Repaso: un test y tus errores.
          Repaso mensual: test por bloques. Repaso final: simulacro. Y si es día libre, a descansar.
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
          <b>Explora la Constitución</b>: recórrela como un edificio, donde cada Título es una sala. Una vez al día, para entrar en
          cada sala abres su llave: dices de qué artículo a qué artículo va.
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
          planta a planta.
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
          <b>Carrera por la Plaza</b>: compite con 2 a 4 personas, en un solo móvil o cada persona desde el suyo, a ver quién llega
          antes a la meta.
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
          <b>Calendario</b>: planificar te quita la duda de qué toca cada día. Marca cada día con su letra, y se marcará como hecho
          solo cuando completes tu ración.
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
      texto: <>Y a mí me encontrarás siempre aquí: tócame para que te cuente algo y arrástrame donde no te moleste.</>
    },
    { seccion: "¡Al lío!", pantalla: "inicio", texto: <>¡Ya lo tienes todo! Un poquito cada día: insistentes, pero sin agobios.</> }
  ];
}

const cssGuia = `
  @keyframes guiaAparece { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes guiaLatido { 0%, 100% { box-shadow: 0 0 0 9999px rgba(52,44,36,0.55), 0 0 0 0 rgba(242,203,143,0.9); } 50% { box-shadow: 0 0 0 9999px rgba(52,44,36,0.55), 0 0 0 8px rgba(242,203,143,0.45); } }
`;

export default function GuiaVisita({ paso, setPaso, pantalla, irA, onFin }) {
  const personaje = registroPersonajes[obtenerPersonajeActivo()] || registroPersonajes["ander-egg"] || {};
  const lista = pasos(personaje.nombre || "tu personaje");
  const p = lista[Math.min(paso, lista.length - 1)];
  const ultimo = paso >= lista.length - 1;
  const [rect, setRect] = useState(null);

  // 🧭 llevar a la pantalla del paso (o avanzar si la persona ha pulsado donde tocaba)
  useEffect(() => {
    if (p.toque && pantalla === p.toque) {
      setPaso(paso + 1);
      return;
    }
    if (pantalla !== p.pantalla) irA(p.pantalla);
  }, [paso, pantalla]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const Anim = p.anim ? ANIMACIONES[p.anim] : null;
  const alto = window.innerHeight;
  const arriba = rect && rect.top + rect.height / 2 > alto * 0.5; // el bocadillo va al otro lado de lo iluminado
  const posicionBocadillo = !rect
    ? { top: "50%", transform: "translate(-50%, -50%)" }
    : arriba
    ? { bottom: Math.max(12, alto - rect.top + 12) }
    : { top: Math.min(alto - 220, rect.top + rect.height + 12) };

  // zonas que bloquean los toques (dejan libre lo iluminado cuando hay que pulsarlo)
  const bloqueos = rect && p.toque
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, rect.top) },
        { top: rect.top + rect.height, left: 0, right: 0, bottom: 0 },
        { top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height },
        { top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }
      ]
    : [{ inset: 0 }];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: "none", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <style>{cssGuia}</style>

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

      {/* 💬 bocadillo del personaje */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          width: "min(350px, calc(100vw - 28px))",
          ...posicionBocadillo,
          ...(posicionBocadillo.transform ? {} : { transform: "translateX(-50%)" }),
          pointerEvents: "auto"
        }}
      >
      <div
        key={paso}
        style={{
          background: "#fdfaf4",
          borderRadius: 24,
          padding: "14px 16px 12px",
          boxSizing: "border-box",
          boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
          color: "#4a463f",
          animation: "guiaAparece 0.35s ease both"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          {personaje.foto ? (
            <img src={personaje.foto} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#e9dff3", flexShrink: 0 }} />
          )}
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
        <div style={{ height: 4, borderRadius: 4, background: "#efe6d8", marginBottom: 10, overflow: "hidden" }}>
          <div style={{ width: `${((paso + 1) / lista.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #d9cdf0, #f3cdd2)", transition: "width 0.3s ease" }} />
        </div>

        {Anim && <Anim />}

        <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.5 }}>{p.texto}</p>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          {p.toque ? (
            <span style={{ flex: 2, textAlign: "center", fontSize: 12.5, color: "#8a6a4f" }}>Pulsa donde brilla ✨</span>
          ) : (
            <button
              onClick={() => (ultimo ? onFin() : setPaso(paso + 1))}
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
