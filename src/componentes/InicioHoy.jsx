import { useEffect, useMemo, useState } from "react";
import { TIPOS_DIA, HOY_TE_TOCA } from "./MiCalendario";
import { MANO } from "./Hub";
import { claveFecha, esDiaDeDescanso } from "../servicios/calendario";
import {
  obtenerStats,
  obtenerRacion,
  clasificarErrores,
  rachaVigente,
  diasCumplidos,
  marcarDiaCumplido,
  obtenerExtrasRacion,
  guardarExtrasRacion
} from "../servicios/progreso";
import iconoPlantita from "../assets/kit/icono-plantita-evolucion.png";
import iconoRachaLlama from "../assets/bookbrand/icono-brand-racha-llama.png";
import iconoTest from "../assets/kit/icono-test.png";
import iconoErrores from "../assets/kit/icono-repasar-errores-hero.png";
import iconoErre from "../assets/kit/icono-hub-erre-que-erre.png";
import iconoReloj from "../assets/kit/icono-reloj-simulacro.png";
import iconoTaza from "../assets/kit/icono-taza-perfil.png";
import iconoDados from "../assets/kit/icono-dados-minijuegos.png";
import semana0 from "../assets/kit/jardin-semana-0.png";
import semana1 from "../assets/kit/jardin-semana-1.png";
import semana2 from "../assets/kit/jardin-semana-2.png";
import semana3 from "../assets/kit/jardin-semana-3.png";
import semana4 from "../assets/kit/jardin-semana-4.png";
import semana5 from "../assets/kit/jardin-semana-5.png";
import semana6 from "../assets/kit/jardin-semana-6.png";
import semana7 from "../assets/kit/jardin-semana-7.png";

// 🌱 la planta de la semana: semilla el lunes, una hoja por día cumplido y flor el séptimo
const PLANTA_SEMANA = [semana0, semana1, semana2, semana3, semana4, semana5, semana6, semana7];

const COLOR_TAREA = {
  test: "#f8e6e8",
  errores: "#fbf0f1",
  erre: "#ebe4f7",
  simulacro: "#f8e6e8"
};

const cssInicio = `
  @keyframes selloHecho { 0% { opacity: 0; transform: rotate(-12deg) scale(1.8); } 70% { opacity: 1; transform: rotate(-12deg) scale(0.95); } 100% { opacity: 1; transform: rotate(-12deg) scale(1); } }
  @keyframes hojaAparece { from { opacity: 0; transform: translateY(4px) scale(0.85); } to { opacity: 1; transform: none; } }
  .racion-tarjeta { transition: transform 0.15s ease; }
  .racion-tarjeta:active { transform: scale(0.97) !important; }
`;

// 📝 qué toca hoy, según el día del calendario (y lo que hayas añadido tú)
function tareasDeHoy(tipo, pendientes, extras) {
  const errores = pendientes > 0
    ? [{ id: "errores", titulo: "Errores", texto: `${Math.min(10, pendientes)} pendientes`, icono: iconoErrores, destino: "estudiar-errores" }]
    : [];
  const test = (titulo, texto) => ({ id: "test", titulo, texto, icono: iconoTest, destino: "estudiar-estudio" });
  const erre = { id: "erre", titulo: "Erre que erre", texto: "1 artículo", icono: iconoErre, destino: "erre" };

  let tareas;
  if (tipo === "R") tareas = errores.length ? [...errores, erre] : [test("Test de 10", "Del bloque que quieras"), erre];
  else if (tipo === "M") tareas = [test("Test mezclado", "Todos los bloques")];
  else if (tipo === "F") tareas = [{ id: "simulacro", titulo: "Simulacro", texto: "Con calma", icono: iconoReloj, destino: "simulacro" }];
  // día de estudio, o día sin marcar en el calendario
  else tareas = [test("Test de 10", "Del bloque que estudias"), ...errores];

  if (extras.erre && !tareas.some((t) => t.id === "erre")) tareas.push(erre);
  return tareas;
}

// 🍃 hojita de cada día (dibujada en el mismo trazo que las ilustraciones)
function Hojita({ estado }) {
  const relleno = { hecho: "#9fbf8f", falta: "#f7f2ea", hoy: "#e3ecd9", futuro: "transparent" }[estado];
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={estado === "futuro" ? "#d8cfc0" : "#4a463f"}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={estado === "hecho" ? { animation: "hojaAparece 0.4s ease both" } : undefined}
    >
      <path d="M12 3 C17 6 18.5 12 12 21 C5.5 12 7 6 12 3 Z" fill={relleno} strokeDasharray={estado === "hoy" ? "2 2" : undefined} />
      <path d="M12 7 V18" />
    </svg>
  );
}

function Washi({ color, rot = -4, left = "50%" }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -8,
        left,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        width: 64,
        height: 16,
        background: color,
        opacity: 0.75,
        borderRadius: 2
      }}
    />
  );
}

// interruptor del cuaderno
function Interruptor({ activo, onCambio, etiqueta }) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onCambio(!activo)}
      style={{
        flexShrink: 0,
        width: 48,
        height: 28,
        borderRadius: 999,
        border: "none",
        padding: 3,
        cursor: "pointer",
        background: activo ? "linear-gradient(135deg, #b9a8de, #e2a3a9)" : "#e8e0d4",
        display: "flex",
        justifyContent: activo ? "flex-end" : "flex-start",
        transition: "background 0.2s ease"
      }}
    >
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fffdf9", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }} />
    </button>
  );
}

export default function InicioHoy({ usuario, preguntas, bloquesDe, calendario, irA, buzon }) {
  const tipo = usuario ? calendario.tipoHoy : null;
  const datosTipo = tipo ? TIPOS_DIA[tipo] : null;
  const descanso = esDiaDeDescanso(tipo);
  const racha = rachaVigente();
  const racion = obtenerRacion();
  const [extras, setExtras] = useState(() => obtenerExtrasRacion());
  const [personalizando, setPersonalizando] = useState(false);

  // errores pendientes (🔴 + 🟡): solo aparecen en la ración si tienes
  const pendientes = useMemo(() => {
    const { prioritarios, seguimiento } = clasificarErrores(preguntas);
    return prioritarios.length + seguimiento.length;
  }, [preguntas]);

  const tareas = descanso ? [] : tareasDeHoy(tipo, pendientes, extras);
  const completa = tareas.length > 0 && tareas.every((t) => racion[t.id]);
  const claveHoy = claveFecha();

  // ✅ al completar la ración: el día cuenta para la planta y se marca solo en el calendario
  useEffect(() => {
    if (!completa) return;
    marcarDiaCumplido(claveHoy);
    if (tipo && !descanso) calendario.marcarHoyHecho();
  }, [completa, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  function cambiarExtra(clave, valor) {
    const nuevos = { ...extras, [clave]: valor };
    setExtras(nuevos);
    guardarExtrasRacion(nuevos);
  }

  // 🌱 tu semana (de lunes a domingo)
  const semana = useMemo(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const cumplidos = diasCumplidos();
    return ["L", "M", "X", "J", "V", "S", "D"].map((letra, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      const clave = claveFecha(d);
      const marca = calendario.dias[clave];
      const pasado = clave <= claveHoy;
      const deDescanso = esDiaDeDescanso(marca);
      // los días libres o de vacaciones del calendario también cuentan: descansar era el plan
      const hecho = pasado && (cumplidos[clave] || calendario.hechos[clave] || deDescanso || (clave === claveHoy && completa));
      let estado = "futuro";
      if (hecho) estado = "hecho";
      else if (clave === claveHoy) estado = "hoy";
      else if (pasado) estado = "falta";
      return { letra, estado, deDescanso };
    });
  }, [calendario.dias, calendario.hechos, completa]); // eslint-disable-line react-hooks/exhaustive-deps
  const cumplidosSemana = semana.filter((d) => d.estado === "hecho").length;

  // 🌿 el bloque que flojea (peor porcentaje, con al menos 5 respuestas y por debajo del 60 %)
  const flojo = useMemo(() => {
    const stats = obtenerStats();
    const existentes = new Set((bloquesDe || preguntas).map((p) => p.bloque || "Sin bloque"));
    const lista = {};
    Object.values(stats).forEach((s) => {
      const b = s.bloque || "Sin bloque";
      if (!existentes.has(b)) return;
      if (!lista[b]) lista[b] = { nombre: b, respondidas: 0, aciertos: 0 };
      lista[b].respondidas += s.veces || 0;
      lista[b].aciertos += s.aciertos || 0;
    });
    return Object.values(lista)
      .filter((b) => b.respondidas >= 5 && b.aciertos / b.respondidas < 0.6)
      .sort((a, b) => a.aciertos / a.respondidas - b.aciertos / b.respondidas)[0];
  }, [preguntas, bloquesDe]);

  const textoSemana =
    cumplidosSemana === 7
      ? "¡Semana completa! Tu planta ha florecido."
      : cumplidosSemana === 0
      ? "Cada día cumplido, le sale una hoja."
      : `${cumplidosSemana} de 7 días. Cada día cumplido, una hoja más.`;

  const tarjeta = {
    position: "relative",
    background: "#fdfaf4",
    borderRadius: 24,
    padding: "12px 14px",
    boxShadow: "0 3px 14px rgba(0,0,0,0.04)"
  };

  return (
    <>
      <style>{cssInicio}</style>

      {/* cabecera: nombre y buzón */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ ...MANO, fontSize: 30, color: "#5b4a3a" }}>Insistentes Sociales</span>
        {buzon}
      </div>

      {/* 🌤️ lo que toca hoy, teñido según el día del calendario */}
      <button
        onClick={() => irA("calendario")}
        style={{
          ...tarjeta,
          width: "100%",
          border: "none",
          textAlign: "left",
          fontFamily: "inherit",
          color: "#4a463f",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          overflow: "hidden"
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: -30,
            top: -40,
            width: 170,
            height: 140,
            borderRadius: "46% 54% 60% 40% / 52% 44% 56% 48%",
            background: `radial-gradient(circle at 45% 50%, ${datosTipo ? datosTipo.fondo : "#dfe8d6"}, rgba(255,255,255,0) 70%)`
          }}
        />
        <img src={descanso ? iconoTaza : iconoPlantita} alt="" style={{ position: "relative", width: 46, height: 46, objectFit: "contain" }} />
        <span style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", ...MANO, fontSize: 25, lineHeight: 1, color: datosTipo ? datosTipo.texto : "#3f5a3a" }}>
            {!tipo ? "Hoy, a tu ritmo" : descanso ? `Hoy, ${HOY_TE_TOCA[tipo].texto}` : `Hoy toca ${HOY_TE_TOCA[tipo].texto}`}
          </span>
          <span style={{ display: "block", fontSize: 12, color: "#5c5850", marginTop: 3 }}>
            {tipo ? HOY_TE_TOCA[tipo].frase : usuario ? "Marca tus días en el calendario" : "Un poquito cada día"}
          </span>
        </span>
        {racha > 0 && (
          <span
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
              fontSize: 11,
              color: "#6e5a4a",
              lineHeight: 1.1
            }}
          >
            <img src={iconoRachaLlama} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
            <b style={{ fontSize: 15 }}>{racha}</b>
            {racha === 1 ? "día" : "días"}
          </span>
        )}
      </button>

      {/* 🍲 TU RACIÓN DE HOY */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 4px" }}>
          <p style={{ ...MANO, margin: 0, fontSize: 25, lineHeight: 1, color: "#5b4a3a" }}>Tu ración de hoy</p>
          {!descanso && (
            <button
              onClick={() => setPersonalizando(true)}
              style={{ border: "none", background: "transparent", padding: 0, fontFamily: "inherit", fontSize: 12, color: "#8a6a4f", cursor: "pointer" }}
            >
              Personalizar ›
            </button>
          )}
        </div>

        {descanso ? (
          <div style={{ ...tarjeta, display: "flex", alignItems: "center", gap: 12, marginTop: 8, background: "#fbf3e6" }}>
            <Washi color="#f3d9a8" rot={-3} />
            <img src={iconoTaza} alt="" style={{ width: 50, height: 50, objectFit: "contain" }} />
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45 }}>
              Tu ración de hoy es: <b>descansar</b>. Deja el móvil por hoy, que te lo mereces.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
              {tareas.map((t, i) => {
                const hecho = !!racion[t.id];
                return (
                  <button
                    key={t.id}
                    className="racion-tarjeta"
                    onClick={() => irA(t.destino)}
                    style={{
                      position: "relative",
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 3,
                      background: COLOR_TAREA[t.id],
                      border: "none",
                      borderRadius: 18,
                      padding: "12px 10px 10px",
                      textAlign: "left",
                      fontFamily: "inherit",
                      color: "#4a463f",
                      cursor: "pointer",
                      transform: `rotate(${i % 2 ? 0.8 : -0.9}deg)`,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.04)"
                    }}
                  >
                    <Washi color={hecho ? "#d9cdf0" : "#f3d9a8"} rot={-3} />
                    {hecho && (
                      <span
                        style={{
                          position: "absolute",
                          right: 6,
                          top: 8,
                          border: "2px solid #b5564f",
                          color: "#b5564f",
                          borderRadius: 7,
                          padding: "0 5px",
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: 1,
                          background: "rgba(255,255,255,0.6)",
                          animation: "selloHecho 0.45s ease both"
                        }}
                      >
                        HECHO
                      </span>
                    )}
                    <img src={t.icono} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, opacity: hecho ? 0.6 : 1 }}>{t.titulo}</span>
                    <span style={{ fontSize: 11, color: "#5c5850", lineHeight: 1.3 }}>{t.texto}</span>
                  </button>
                );
              })}
            </div>

            {/* premio opcional al completarla */}
            {completa && (
              <button
                onClick={() => irA("minijuegos")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  marginTop: 10,
                  border: "1.5px dashed #c9dcb5",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.6)",
                  padding: "6px 12px",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  color: "#4a463f",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <img src={iconoDados} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                <span>
                  <b>¡Ración completa!</b> Si te apetece, un juego de premio.
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* 🌿 TU JARDÍN: la planta de tu semana */}
      <div style={tarjeta}>
        <Washi color="#c9dcb5" rot={3} left="84%" />
        <p style={{ ...MANO, margin: "0 0 2px", fontSize: 25, lineHeight: 1, color: "#5b4a3a" }}>Tu jardín</p>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            key={cumplidosSemana}
            src={PLANTA_SEMANA[cumplidosSemana]}
            alt={`Planta de la semana: ${cumplidosSemana} de 7 días`}
            style={{ width: 62, height: 112, objectFit: "contain", flexShrink: 0, animation: "hojaAparece 0.6s ease both" }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12.5, color: "#5c5850", lineHeight: 1.4, marginBottom: 8 }}>{textoSemana}</span>
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              {semana.map((d) => (
                <span
                  key={d.letra}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontSize: 10, color: "#7d7468" }}
                >
                  {d.deDescanso && d.estado === "hecho" ? (
                    <img src={iconoTaza} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                  ) : (
                    <Hojita estado={d.estado} />
                  )}
                  {d.letra}
                </span>
              ))}
            </span>
          </span>
        </div>

        {flojo && (
          <button
            onClick={() => irA("estudiar-progreso")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              marginTop: 8,
              paddingTop: 8,
              border: "none",
              borderTop: "1px solid #efe6d8",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 12.5,
              color: "#4a463f",
              textAlign: "left",
              cursor: "pointer"
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>Para reforzar:</b> <span style={{ color: "#8a6a3a" }}>{flojo.nombre}</span>
            </span>
            <span style={{ color: "#b8a993", fontSize: 16 }}>›</span>
          </button>
        )}
      </div>

      {/* ⚙️ personalizar la ración */}
      {personalizando && (
        <div
          onClick={() => setPersonalizando(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(74,70,63,0.28)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#fdfaf4",
              borderRadius: "26px 26px 0 0",
              padding: "20px 20px 28px",
              boxSizing: "border-box",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#4a463f"
            }}
          >
            <p style={{ ...MANO, margin: "0 0 4px", fontSize: 28, lineHeight: 1, color: "#5b4a3a" }}>Personaliza tu ración</p>
            <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#5c5850", lineHeight: 1.45 }}>
              Se suma a lo que toca según tu calendario. En los días de descanso no se añade nada.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid #efe6d8" }}>
              <img src={iconoErre} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
              <span style={{ flex: 1, fontSize: 13.5 }}>
                <b>Erre que erre</b>
                <span style={{ display: "block", fontSize: 12, color: "#5c5850" }}>Una ficha cada día</span>
              </span>
              <Interruptor activo={!!extras.erre} onCambio={(v) => cambiarExtra("erre", v)} etiqueta="Añadir Erre que erre cada día" />
            </div>
            <button
              onClick={() => setPersonalizando(false)}
              style={{
                width: "100%",
                marginTop: 12,
                border: "none",
                borderRadius: 18,
                padding: "12px 16px",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                color: "#5a4636",
                background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
                cursor: "pointer"
              }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
