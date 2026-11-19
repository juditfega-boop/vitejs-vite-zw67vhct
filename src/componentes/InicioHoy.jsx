import { useEffect, useMemo } from "react";
import { TIPOS_DIA, HOY_TE_TOCA } from "./MiCalendario";
import { MANO } from "./Hub";
import { claveFecha, esDiaDeDescanso } from "../servicios/calendario";
import {
  obtenerStats,
  obtenerRacion,
  clasificarErrores,
  preguntasResueltasJardin,
  rachaVigente
} from "../servicios/progreso";
import iconoPlantita from "../assets/kit/icono-plantita-evolucion.png";
import iconoRachaLlama from "../assets/bookbrand/icono-brand-racha-llama.png";
import iconoTest from "../assets/kit/icono-test.png";
import iconoErrores from "../assets/kit/icono-repasar-errores-hero.png";
import iconoErre from "../assets/kit/icono-hub-erre-que-erre.png";
import iconoReloj from "../assets/kit/icono-reloj-simulacro.png";
import iconoTaza from "../assets/kit/icono-taza-perfil.png";
import iconoDados from "../assets/kit/icono-dados-minijuegos.png";
import planta1 from "../assets/kit/jardin-planta-1.png";
import planta2 from "../assets/kit/jardin-planta-2.png";
import planta3 from "../assets/kit/jardin-planta-3.png";
import planta4 from "../assets/kit/jardin-planta-4.png";
import planta5 from "../assets/kit/jardin-planta-5.png";
import macetaSana from "../assets/kit/jardin-maceta-sana.png";
import macetaMustia from "../assets/kit/jardin-maceta-mustia.png";
import macetaVacia from "../assets/kit/jardin-maceta-vacia.png";

// 🌱 la planta crece por etapas con las preguntas resueltas (nunca encoge)
const ETAPAS = [
  { desde: 0, imagen: planta1 },
  { desde: 1, imagen: planta2 },
  { desde: 10, imagen: planta3 },
  { desde: 40, imagen: planta4 },
  { desde: 100, imagen: planta5 }
];

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

// 📝 qué toca hoy, según el día del calendario
function tareasDeHoy(tipo, pendientes) {
  const errores = pendientes > 0
    ? [{ id: "errores", titulo: "Repasar errores", texto: `${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"}${pendientes > 10 ? " · hasta 10" : ""}`, icono: iconoErrores, destino: "estudiar-errores" }]
    : [];
  const test = (titulo, texto) => ({ id: "test", titulo, texto, icono: iconoTest, destino: "estudiar-estudio" });

  if (tipo === "R") {
    const erre = { id: "erre", titulo: "1 ficha de Erre que erre", texto: "Un artículo, de memoria", icono: iconoErre, destino: "erre" };
    return errores.length ? [...errores, erre] : [test("Test de 10", "El bloque que quieras"), erre];
  }
  if (tipo === "M") return [test("Test mezclado", "De todos los bloques")];
  if (tipo === "F") {
    return [{ id: "simulacro", titulo: "Simulacro", texto: "Examen completo, con calma", icono: iconoReloj, destino: "simulacro" }];
  }
  // día de estudio, o día sin marcar en el calendario
  return [test("Test de 10", "Del bloque que estás estudiando"), ...errores];
}

// 🍃 hojita de la semana (dibujada aquí, en el mismo trazo que las ilustraciones)
function Hojita({ estado }) {
  const relleno = { hecho: "#9fbf8f", falta: "#f7f2ea", hoy: "#dbe7d3", nada: "transparent" }[estado];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={estado === "nada" ? "#d8cfc0" : "#4a463f"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={estado === "hecho" ? { animation: "hojaAparece 0.4s ease both" } : undefined}>
      <path d="M12 3 C17 6 18.5 12 12 21 C5.5 12 7 6 12 3 Z" fill={relleno} strokeDasharray={estado === "hoy" ? "2 2" : undefined} />
      <path d="M12 7 V18" />
    </svg>
  );
}

function washi(color, rot = -4, left = "50%") {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -9,
        left,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        width: 78,
        height: 18,
        background: color,
        opacity: 0.75,
        borderRadius: 2
      }}
    />
  );
}

export default function InicioHoy({ usuario, preguntas, bloquesDe, calendario, irA, buzon }) {
  const tipo = usuario ? calendario.tipoHoy : null;
  const datosTipo = tipo ? TIPOS_DIA[tipo] : null;
  const descanso = esDiaDeDescanso(tipo);
  const racha = rachaVigente();
  const racion = obtenerRacion();

  // errores pendientes (🔴 + 🟡): solo aparecen en la ración si tienes
  const pendientes = useMemo(() => {
    const { prioritarios, seguimiento } = clasificarErrores(preguntas);
    return prioritarios.length + seguimiento.length;
  }, [preguntas]);

  const tareas = descanso ? [] : tareasDeHoy(tipo, pendientes);
  const completa = tareas.length > 0 && tareas.every((t) => racion[t.id]);

  // ✅ al completar la ración, el día se marca solo como hecho en el calendario
  useEffect(() => {
    if (completa && tipo && !descanso) calendario.marcarHoyHecho();
  }, [completa, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🌱 jardín
  const resueltas = preguntasResueltasJardin();
  const etapa = [...ETAPAS].reverse().find((e) => resueltas >= e.desde);
  const siguiente = ETAPAS.find((e) => e.desde > resueltas);

  const bloques = useMemo(() => {
    const stats = obtenerStats();
    const lista = {};
    (bloquesDe || preguntas).forEach((p) => {
      const b = p.bloque || "Sin bloque";
      if (!lista[b]) lista[b] = { nombre: b, respondidas: 0, aciertos: 0 };
    });
    Object.values(stats).forEach((s) => {
      const b = lista[s.bloque || "Sin bloque"];
      if (!b) return;
      b.respondidas += s.veces || 0;
      b.aciertos += s.aciertos || 0;
    });
    const practicados = Object.values(lista).filter((b) => b.respondidas > 0);
    // el que flojea: el de peor porcentaje (con al menos 5 respuestas y por debajo del 60 %)
    const flojo = practicados
      .filter((b) => b.respondidas >= 5 && b.aciertos / b.respondidas < 0.6)
      .sort((a, b) => a.aciertos / a.respondidas - b.aciertos / b.respondidas)[0];
    return { total: Object.keys(lista).length, practicados: practicados.length, flojo };
  }, [preguntas, bloquesDe]);

  const macetas = [
    ...Array(Math.max(0, bloques.practicados - (bloques.flojo ? 1 : 0))).fill(macetaSana),
    ...(bloques.flojo ? [macetaMustia] : []),
    ...Array(Math.max(0, bloques.total - bloques.practicados)).fill(macetaVacia)
  ];

  // 🍃 esta semana (de lunes a domingo), según el calendario
  const semana = useMemo(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const claveHoy = claveFecha(hoy);
    return ["L", "M", "X", "J", "V", "S", "D"].map((letra, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      const clave = claveFecha(d);
      const marca = calendario.dias[clave];
      let estado = "nada";
      if (esDiaDeDescanso(marca)) estado = "descanso";
      else if (marca) estado = calendario.hechos[clave] ? "hecho" : clave === claveHoy ? "hoy" : "falta";
      return { letra, estado };
    });
  }, [calendario.dias, calendario.hechos]);
  const planificados = semana.filter((d) => ["hecho", "hoy", "falta"].includes(d.estado)).length;
  const cumplidos = semana.filter((d) => d.estado === "hecho").length;

  const tarjeta = {
    position: "relative",
    background: "#fdfaf4",
    borderRadius: 26,
    padding: "14px 16px",
    boxShadow: "0 3px 14px rgba(0,0,0,0.04)"
  };

  return (
    <>
      <style>{cssInicio}</style>

      {/* cabecera: nombre y buzón */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ ...MANO, fontSize: 32, color: "#5b4a3a" }}>Insistentes Sociales</span>
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
          gap: 14,
          padding: "14px 18px",
          marginBottom: 18,
          overflow: "hidden"
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: -30,
            top: -40,
            width: 190,
            height: 160,
            borderRadius: "46% 54% 60% 40% / 52% 44% 56% 48%",
            background: `radial-gradient(circle at 45% 50%, ${datosTipo ? datosTipo.fondo : "#dfe8d6"}, rgba(255,255,255,0) 70%)`
          }}
        />
        <img src={descanso ? iconoTaza : iconoPlantita} alt="" style={{ position: "relative", width: 58, height: 58, objectFit: "contain" }} />
        <span style={{ position: "relative", flex: 1 }}>
          <span style={{ display: "block", ...MANO, fontSize: 29, lineHeight: 1, color: datosTipo ? datosTipo.texto : "#3f5a3a" }}>
            {!tipo ? "Hoy, a tu ritmo" : descanso ? `Hoy, ${HOY_TE_TOCA[tipo].texto}` : `Hoy toca ${HOY_TE_TOCA[tipo].texto}`}
          </span>
          <span style={{ display: "block", fontSize: 12.5, color: "#5c5850", margin: "4px 0 0" }}>
            {tipo ? HOY_TE_TOCA[tipo].frase : usuario ? "Marca tus días en el calendario" : "Un poquito cada día"}
          </span>
          {racha > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 7,
                background: "#fff",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 12
              }}
            >
              <img src={iconoRachaLlama} alt="" style={{ width: 15, height: 15, objectFit: "contain" }} />
              {racha} {racha === 1 ? "día seguido" : "días seguidos"}
            </span>
          )}
        </span>
      </button>

      {/* 🍲 TU RACIÓN DE HOY */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ ...MANO, margin: "0 0 6px", fontSize: 26, lineHeight: 1, color: "#5b4a3a" }}>
          Tu ración de hoy
          {!descanso && (
            <span style={{ fontFamily: "Arial", fontWeight: 400, fontSize: 12, color: "#7d7468", marginLeft: 8 }}>
              unos 15–20 min
            </span>
          )}
        </p>

        {descanso ? (
          <div style={{ ...tarjeta, display: "flex", alignItems: "center", gap: 14, marginTop: 8, background: "#fbf3e6" }}>
            {washi("#f3d9a8", -3)}
            <img src={iconoTaza} alt="" style={{ width: 56, height: 56, objectFit: "contain" }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
              Tu ración de hoy es: <b>descansar</b>. Deja el móvil por hoy, que te lo mereces.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
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
                      gap: 6,
                      background: COLOR_TAREA[t.id],
                      border: "none",
                      borderRadius: 20,
                      padding: "14px 12px 12px",
                      textAlign: "left",
                      fontFamily: "inherit",
                      color: "#4a463f",
                      cursor: "pointer",
                      transform: `rotate(${i % 2 ? 1 : -1.2}deg)`,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.04)"
                    }}
                  >
                    {washi(hecho ? "#d9cdf0" : "#f3d9a8", -3)}
                    {hecho && (
                      <span
                        style={{
                          position: "absolute",
                          right: 8,
                          top: 10,
                          border: "2px solid #b5564f",
                          color: "#b5564f",
                          borderRadius: 8,
                          padding: "1px 7px",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 1,
                          background: "rgba(255,255,255,0.6)",
                          animation: "selloHecho 0.45s ease both"
                        }}
                      >
                        HECHO
                      </span>
                    )}
                    <span
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <img src={t.icono} alt="" style={{ width: 38, height: 38, objectFit: "contain" }} />
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, opacity: hecho ? 0.6 : 1 }}>{t.titulo}</span>
                    <span style={{ fontSize: 11.5, color: "#5c5850", lineHeight: 1.35 }}>{t.texto}</span>
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
                  marginTop: 12,
                  border: "1.5px dashed #c9dcb5",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.6)",
                  padding: "8px 14px",
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: "#4a463f",
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <img src={iconoDados} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                <span>
                  <b>¡Ración completa!</b> Si te apetece, un juego de premio.
                </span>
              </button>
            )}
          </>
        )}
      </div>

      {/* 🌿 TU JARDÍN */}
      <div style={tarjeta}>
        {washi("#c9dcb5", 3, "82%")}
        <p style={{ ...MANO, margin: "0 0 4px", fontSize: 26, lineHeight: 1, color: "#5b4a3a" }}>Tu jardín</p>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            key={etapa.desde}
            src={etapa.imagen}
            alt=""
            style={{ width: 70, height: 138, objectFit: "contain", animation: "hojaAparece 0.6s ease both" }}
          />
          <span>
            <span style={{ display: "block", fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{resueltas}</span>
            <span style={{ fontSize: 12.5, color: "#5c5850", lineHeight: 1.45 }}>
              {resueltas === 1 ? "pregunta resuelta" : "preguntas resueltas"}.
              <br />
              {siguiente
                ? `Te ${siguiente.desde - resueltas === 1 ? "falta 1" : `faltan ${siguiente.desde - resueltas}`} para que tu planta crezca.`
                : "Tu planta ya está en flor."}
            </span>
          </span>
        </div>

        {bloques.total > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2px 10px", fontSize: 12, marginBottom: 4 }}>
              <b>
                Has practicado {bloques.practicados} de {bloques.total} {bloques.total === 1 ? "bloque" : "bloques"}
              </b>
              {bloques.flojo && <span style={{ color: "#8a6a3a" }}>Flojea: {bloques.flojo.nombre}</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {macetas.map((m, i) => (
                <img key={i} src={m} alt="" style={{ width: 20, height: 36, objectFit: "contain" }} />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span>
            <b style={{ display: "block", fontSize: 12 }}>Esta semana</b>
            <span style={{ fontSize: 11.5, color: "#5c5850" }}>
              {planificados > 0 ? `${cumplidos} de ${planificados} días` : "Planifícala en tu calendario"}
            </span>
          </span>
          <span style={{ display: "flex", gap: 1 }}>
            {semana.map((d) => (
              <span
                key={d.letra}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, fontSize: 10, color: "#7d7468" }}
              >
                {d.estado === "descanso" ? (
                  <img src={iconoTaza} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                ) : (
                  <Hojita estado={d.estado} />
                )}
                {d.letra}
              </span>
            ))}
          </span>
        </div>
      </div>
    </>
  );
}
