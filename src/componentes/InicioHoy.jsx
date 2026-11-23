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
import iconoExplora from "../assets/kit/icono-explora.png";
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
  explora: "#f1ecfa",
  simulacro: "#f8e6e8"
};

// 🧩 las tareas que puede llevar la ración
const TAREAS = {
  erre: { id: "erre", titulo: "Erre que erre", texto: "1 artículo", icono: iconoErre, destino: "erre" },
  explora: { id: "explora", titulo: "Explora", texto: "1 artículo", icono: iconoExplora, destino: "explora" },
  test: { id: "test", titulo: "Test de 10", texto: "De lo que estudias", icono: iconoTest, destino: "estudiar-estudio" },
  errores: { id: "errores", titulo: "Errores", texto: "Tus pendientes", icono: iconoErrores, destino: "estudiar-errores" },
  simulacro: { id: "simulacro", titulo: "Simulacro", texto: "Con calma", icono: iconoReloj, destino: "simulacro" }
};

// las que se pueden añadir o quitar en "Personalizar"
const PERSONALIZABLES = [
  { id: "erre", nombre: "Erre que erre", detalle: "Memorizar un artículo" },
  { id: "explora", nombre: "Explora la Constitución", detalle: "Abrir un artículo" },
  { id: "test", nombre: "Test de 10", detalle: "Preguntas de lo que estudias" },
  { id: "errores", nombre: "Repasar errores", detalle: "Solo si tienes pendientes" }
];

const cssInicio = `
  @keyframes selloHecho { 0% { opacity: 0; transform: rotate(-12deg) scale(1.8); } 70% { opacity: 1; transform: rotate(-12deg) scale(0.95); } 100% { opacity: 1; transform: rotate(-12deg) scale(1); } }
  @keyframes hojaAparece { from { opacity: 0; transform: translateY(4px) scale(0.85); } to { opacity: 1; transform: none; } }
  .racion-tarjeta { transition: transform 0.15s ease; }
  .racion-tarjeta:active { transform: scale(0.97) !important; }
`;

// 📝 qué toca hoy, según el día del calendario (y lo que hayas añadido o quitado tú)
// extras: { erre: "siempre" | "nunca", … } — lo que no está, va "según el día"
function tareasDeHoy(tipo, pendientes, extras) {
  let ids;
  if (tipo === "E") ids = ["erre", "explora"]; // estudio: memorizar
  else if (tipo === "R") ids = ["test", "errores"]; // repaso
  else if (tipo === "M") ids = ["test"]; // repaso mensual
  else if (tipo === "F") ids = ["simulacro"]; // repaso final
  else ids = ["test", "errores"]; // día sin marcar: a tu ritmo

  PERSONALIZABLES.forEach(({ id }) => {
    const modo = extras[id] === true ? "siempre" : extras[id];
    if (modo === "siempre" && !ids.includes(id)) ids.push(id);
    if (modo === "nunca") ids = ids.filter((x) => x !== id);
  });

  return ids
    .filter((id) => id !== "errores" || pendientes > 0) // quien empieza no tiene errores que repasar
    .map((id) => {
      const t = { ...TAREAS[id] };
      if (id === "errores") t.texto = `${Math.min(10, pendientes)} pendientes`;
      if (id === "test" && tipo === "M") {
        t.titulo = "Test por bloques";
        t.texto = "De lo que estudias";
      }
      return t;
    });
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

// 🗓️ anillo pequeño del mes (verde salvia sobre papel)
function AnilloMes({ hechos, total }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const parte = total ? Math.min(1, hechos / total) : 0;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#efe6d8" strokeWidth="7" />
      {parte > 0 && (
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#9fbf8f"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${parte * c} ${c}`}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      )}
      <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fill="#4a463f" fontFamily="Arial, Helvetica, sans-serif">
        {total ? `${Math.round(parte * 100)}%` : "–"}
      </text>
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

export default function InicioHoy({ usuario, preguntas, bloquesDe, calendario, irA, buzon, reforzar }) {
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
    if (valor === undefined) delete nuevos[clave];
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

  // 🗓️ el mes: de los días planificados en el calendario (sin libres ni vacaciones), cuántos se han cumplido
  const mes = useMemo(() => {
    const hoy = new Date();
    const cumplidos = diasCumplidos();
    let planificados = 0;
    let hechos = 0;
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    while (d.getMonth() === hoy.getMonth()) {
      const clave = claveFecha(d);
      const marca = calendario.dias[clave];
      if (marca && !esDiaDeDescanso(marca)) {
        planificados++;
        if (cumplidos[clave] || calendario.hechos[clave] || (clave === claveHoy && completa)) hechos++;
      }
      d.setDate(d.getDate() + 1);
    }
    const nombre = hoy.toLocaleDateString("es-ES", { month: "long" });
    return { planificados, hechos, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1) };
  }, [calendario.dias, calendario.hechos, completa]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <span data-guia="buzon">{buzon}</span>
      </div>

      {/* 🌤️ lo que toca hoy, teñido según el día del calendario */}
      <button
        data-guia="hoy"
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
      <div data-guia="racion" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 0 4px" }}>
          <p style={{ ...MANO, margin: 0, fontSize: 25, lineHeight: 1, color: "#5b4a3a" }}>Tu ración de hoy</p>
          {!descanso && (
            <button
              data-guia="personalizar"
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${tareas.length === 4 ? 2 : Math.max(1, tareas.length)}, minmax(0, 1fr))`,
                gap: 10,
                paddingTop: 8
              }}
            >
              {tareas.map((t, i) => {
                const hecho = !!racion[t.id];
                return (
                  <button
                    key={t.id}
                    className="racion-tarjeta"
                    onClick={() => irA(t.destino)}
                    style={{
                      position: "relative",
                      minWidth: 0,
                      display: "flex",
                      flexDirection: tareas.length === 4 ? "row" : "column",
                      alignItems: tareas.length === 4 ? "center" : "flex-start",
                      gap: tareas.length === 4 ? 8 : 3,
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
                    <img src={t.icono} alt="" style={{ width: tareas.length === 4 ? 38 : 44, height: tareas.length === 4 ? 38 : 44, objectFit: "contain", flexShrink: 0 }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, opacity: hecho ? 0.6 : 1 }}>{t.titulo}</span>
                      <span style={{ display: "block", fontSize: 11, color: "#5c5850", lineHeight: 1.3 }}>{t.texto}</span>
                    </span>
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
      <div data-guia="jardin" style={tarjeta}>
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
          onClick={() => (reforzar ? reforzar(flojo.nombre) : irA("estudiar-progreso"))}
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
            <span style={{ color: "#8a6a4f", fontSize: 12, whiteSpace: "nowrap" }}>Test de 10 ›</span>
          </button>
        )}
      </div>

      {/* 🗓️ EL MES: lo planificado y lo cumplido */}
      {usuario && (
        <button
          data-guia="mes"
          onClick={() => irA("calendario")}
          style={{
            ...tarjeta,
            width: "100%",
            marginTop: 12,
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
            fontFamily: "inherit",
            color: "#4a463f",
            cursor: "pointer"
          }}
        >
          <AnilloMes hechos={mes.hechos} total={mes.planificados} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", ...MANO, fontSize: 23, lineHeight: 1, color: "#5b4a3a" }}>{mes.nombre}</span>
            <span style={{ display: "block", fontSize: 12.5, color: "#5c5850", lineHeight: 1.4, marginTop: 3 }}>
              {mes.planificados === 0
                ? "Marca los días en el calendario."
                : mes.hechos === mes.planificados
                ? "¡Mes completo!"
                : "Días cumplidos de los planificados"}
            </span>
          </span>
          <span style={{ color: "#b8a993", fontSize: 16 }}>›</span>
        </button>
      )}

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
              Elige qué quieres hacer cada día. «Según el día» sigue lo que toca en tu calendario. En los días de descanso no se añade nada.
            </p>
            {PERSONALIZABLES.map((p) => {
              const modo = extras[p.id] === true ? "siempre" : extras[p.id] || "dia";
              return (
                <div key={p.id} style={{ padding: "9px 0", borderTop: "1px solid #efe6d8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <img src={TAREAS[p.id].icono} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
                    <span style={{ fontSize: 13.5 }}>
                      <b>{p.nombre}</b>
                      <span style={{ display: "block", fontSize: 11.5, color: "#5c5850" }}>{p.detalle}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }} role="radiogroup" aria-label={p.nombre}>
                    {[
                      ["dia", "Según el día"],
                      ["siempre", "Siempre"],
                      ["nunca", "Nunca"]
                    ].map(([valor, texto]) => (
                      <button
                        key={valor}
                        role="radio"
                        aria-checked={modo === valor}
                        onClick={() => cambiarExtra(p.id, valor === "dia" ? undefined : valor)}
                        style={{
                          flex: 1,
                          border: "none",
                          borderRadius: 999,
                          padding: "7px 4px",
                          fontSize: 12,
                          fontFamily: "inherit",
                          cursor: "pointer",
                          color: modo === valor ? "#5a4636" : "#7d7468",
                          fontWeight: modo === valor ? 700 : 400,
                          background: modo === valor ? "linear-gradient(135deg, #f2cb8f, #eeb9bd)" : "#f3ede3"
                        }}
                      >
                        {texto}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
