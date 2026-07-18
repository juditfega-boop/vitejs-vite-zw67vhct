import { useState, useEffect } from "react";
import {
  obtenerStats,
  registrarRespuesta,
  obtenerRacha,
  actualizarRacha,
  obtenerTiempos,
  registrarTiempoPregunta,
  obtenerFavoritos,
  guardarFavoritos
} from "../servicios/progreso";
import { styles } from "../estilos";

function mezclar(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function prepararPregunta(p) {
  const respuestas = p.respuestas.map((r, i) => ({ texto: r, indexOriginal: i }));
  const mezcladas = respuestas.sort(() => Math.random() - 0.5);
  const nuevaCorrecta = mezcladas.findIndex((r) => r.indexOriginal === p.correcta);
  return { ...p, respuestas: mezcladas.map((r) => r.texto), correcta: nuevaCorrecta };
}

function agruparPorBloques(lista) {
  const bloques = {};
  lista.forEach((p) => {
    const b = p.bloque || "Sin bloque";
    if (!bloques[b]) bloques[b] = [];
    bloques[b].push(p);
  });
  return bloques;
}

function formatearTiempo(segundosTotales) {
  const m = Math.floor(segundosTotales / 60);
  const s = segundosTotales % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatearTextoLargo(texto) {
  if (!texto) return "";
  return texto.replace(/\.(?=[A-ZÁÉÍÓÚÑ])/g, ".\n");
}

function renderizarTextoConNegrita(texto) {
  const textoConSaltos = formatearTextoLargo(texto);
  const parrafos = textoConSaltos.split("\n").filter((p) => p.trim() !== "");
  return parrafos.map((parrafo, i) => {
    const partes = parrafo.split(/(\*\*.+?\*\*)/g);
    return (
      <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0" }}>
        {partes.map((parte, j) =>
          parte.startsWith("**") && parte.endsWith("**") ? (
            <b key={j}>{parte.slice(2, -2)}</b>
          ) : (
            parte
          )
        )}
      </p>
    );
  });
}

// 📖 "Estudiar" + Quiz + Mi progreso — componente independiente y autocontenido.
// vistaInicial permite entrar directamente en "config" (botón Estudiar del menú)
// o en "progreso" (botón Mi evolución del menú), compartiendo todo lo demás.
export default function Estudiar({ preguntasBase, volverMenu, sincronizarConNube, vistaInicial = "config" }) {
  const [vista, setVista] = useState(vistaInicial);
  // config|quiz|resultado|progreso|estadisticas|errores|favoritos

  const [preguntas, setPreguntas] = useState([]);
  const [indice, setIndice] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [cantidad, setCantidad] = useState(20);

  const [tipoEstudio, setTipoEstudio] = useState("general");
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [tipoCronometro, setTipoCronometro] = useState("auto");
  const [minutosPersonalizados, setMinutosPersonalizados] = useState(20);
  const [conExplicacion, setConExplicacion] = useState(true);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [inicioPregunta, setInicioPregunta] = useState(null);
  const [favoritos, setFavoritos] = useState(() => obtenerFavoritos());

  const pregunta = preguntas[indice];

  function toggleFavorito(id) {
    setFavoritos((prev) => {
      const idStr = String(id);
      const nuevo = prev.includes(idStr) ? prev.filter((f) => f !== idStr) : [...prev, idStr];
      guardarFavoritos(nuevo);
      return nuevo;
    });
    sincronizarConNube();
  }

  function volverAProgreso() {
    setVista("progreso");
    sincronizarConNube();
  }

  useEffect(() => {
    if (pregunta) setInicioPregunta(Date.now());
  }, [pregunta]);

  useEffect(() => {
    if (vista !== "quiz" || tiempoRestante === null) return;

    if (tiempoRestante <= 0) {
      setTiempoRestante(null);
      setVista("resultado");
      return;
    }

    const id = setTimeout(() => {
      setTiempoRestante((t) => (t !== null ? t - 1 : null));
    }, 1000);

    return () => clearTimeout(id);
  }, [vista, tiempoRestante]);

  function comenzarEstudioPersonalizado() {
    let listaFuente = preguntasBase;

    if (tipoEstudio === "bloques") {
      listaFuente = preguntasBase.filter((p) =>
        bloquesSeleccionados.includes(p.bloque || "Sin bloque")
      );
    }

    const base = mezclar(listaFuente).slice(0, cantidad).map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);

    if (cronometroActivo) {
      const minutos = tipoCronometro === "auto" ? cantidad : (minutosPersonalizados || 1);
      setTiempoRestante(minutos * 60);
    } else {
      setTiempoRestante(null);
    }

    actualizarRacha();
    setVista("quiz");
  }

  function toggleBloqueSeleccionado(nombre) {
    setBloquesSeleccionados((prev) =>
      prev.includes(nombre) ? prev.filter((b) => b !== nombre) : [...prev, nombre]
    );
  }

  function iniciarBloque(lista) {
    const base = mezclar(lista).slice(0, cantidad).map(prepararPregunta);

    setPreguntas(base);
    setIndice(0);
    setAciertos(0);
    setMensaje("");
    setMostrar(false);
    setTiempoRestante(null);
    setConExplicacion(true);
    actualizarRacha();
    setVista("quiz");
  }

  function obtenerPreguntasDebiles(lista) {
    const stats = obtenerStats();
    const muyOlvidadas = [];
    const pendientes = [];
    const recuperadas = [];

    lista.forEach((p) => {
      const s = stats[String(p.id)];
      if (!s) return;

      if (s.aciertos >= s.errores && s.errores > 0) {
        recuperadas.push(p);
      } else if (s.errores >= 3) {
        muyOlvidadas.push(p);
      } else if (s.errores > s.aciertos) {
        pendientes.push(p);
      }
    });

    return [...muyOlvidadas, ...pendientes, ...recuperadas];
  }

  const pendientesErrores = obtenerPreguntasDebiles(preguntasBase).length;

  function comprobar(index) {
    const esCorrecta = index === pregunta.correcta;

    registrarRespuesta(pregunta, esCorrecta);

    if (inicioPregunta) {
      const segundos = Math.round((Date.now() - inicioPregunta) / 1000);
      registrarTiempoPregunta(segundos);
    }

    if (esCorrecta) {
      setMensaje("✅ Correcto");
      setAciertos((a) => a + 1);
    } else {
      setMensaje("❌ Incorrecto");
    }

    setMostrar(true);
  }

  function siguiente() {
    setMensaje("");
    setMostrar(false);

    if (indice + 1 < preguntas.length) {
      setIndice((i) => i + 1);
    } else {
      setVista("resultado");
    }
  }

  // ⚙️ CONFIGURACIÓN DE ESTUDIO
  if (vista === "config") {
    const bloquesDisponibles = Object.keys(agruparPorBloques(preguntasBase));
    const puedeComenzar = tipoEstudio === "general" || bloquesSeleccionados.length > 0;

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Estudiar</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Tipo de estudio</p>
          <div style={styles.pillGroup}>
            <button
              className="pill"
              onClick={() => setTipoEstudio("general")}
              style={{ ...styles.pillBtn, ...(tipoEstudio === "general" ? styles.pillBtnActiva : {}) }}
            >
              Estudio general
            </button>
            <button
              className="pill"
              onClick={() => setTipoEstudio("bloques")}
              style={{ ...styles.pillBtn, ...(tipoEstudio === "bloques" ? styles.pillBtnActiva : {}) }}
            >
              Por bloques
            </button>
          </div>

          {tipoEstudio === "bloques" && (
            <div style={styles.bloquesGrid}>
              {bloquesDisponibles.map((b) => (
                <button
                  key={b}
                  className="bloque-chip"
                  onClick={() => toggleBloqueSeleccionado(b)}
                  style={{
                    ...styles.bloqueChip,
                    ...(bloquesSeleccionados.includes(b) ? styles.bloqueChipActiva : {})
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Número de preguntas</p>
          <div style={styles.pillGroup}>
            {[10, 20, 30, 50, 100].map((n) => (
              <button
                key={n}
                className="pill"
                onClick={() => setCantidad(n)}
                style={{ ...styles.pillBtn, ...(cantidad === n ? styles.pillBtnActiva : {}) }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Activar cronómetro</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={cronometroActivo}
                onChange={() => setCronometroActivo((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {cronometroActivo && (
            <>
              <div style={styles.pillGroup}>
                <button
                  className="pill"
                  onClick={() => setTipoCronometro("auto")}
                  style={{ ...styles.pillBtn, ...(tipoCronometro === "auto" ? styles.pillBtnActiva : {}) }}
                >
                  1 min / pregunta
                </button>
                <button
                  className="pill"
                  onClick={() => setTipoCronometro("personalizado")}
                  style={{
                    ...styles.pillBtn,
                    ...(tipoCronometro === "personalizado" ? styles.pillBtnActiva : {})
                  }}
                >
                  Personalizado
                </button>
              </div>

              {tipoCronometro === "personalizado" && (
                <div style={{ marginTop: 10 }}>
                  <label style={styles.configSubLabel}>Minutos totales: </label>
                  <input
                    type="number"
                    min={1}
                    value={minutosPersonalizados}
                    onChange={(e) => setMinutosPersonalizados(Number(e.target.value))}
                    style={styles.numeroInput}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.configCard}>
          <div style={styles.configRow}>
            <p style={styles.configCardTitle}>Mostrar explicación al responder</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={conExplicacion}
                onChange={() => setConExplicacion((v) => !v)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button
          onClick={comenzarEstudioPersonalizado}
          disabled={!puedeComenzar}
          style={{ ...styles.ctaButton, ...(puedeComenzar ? {} : styles.ctaButtonDisabled) }}
        >
          Comenzar estudio
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // 📈 MI PROGRESO (hub)
  if (vista === "progreso") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Mi progreso</h1>
          <div style={styles.menuUnderline} />
        </div>

        <button
          className="menu-btn"
          onClick={() => setVista("estadisticas")}
          style={{ ...styles.menuButton, ...styles.btnPeach }}
        >
          📊 Estadísticas
        </button>

        <button
          className="menu-btn"
          onClick={() => setVista("errores")}
          style={{ ...styles.menuButton, ...styles.btnPink }}
        >
          ⭐ Repasar errores ({pendientesErrores})
        </button>

        <button
          className="menu-btn"
          onClick={() => setVista("favoritos")}
          style={{ ...styles.menuButton, ...styles.btnOlive }}
        >
          ❤️ Favoritas ({favoritos.length})
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  // ❤️ FAVORITAS
  if (vista === "favoritos") {
    const listaFavoritas = preguntasBase.filter((p) => favoritos.includes(String(p.id)));

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>❤️ Favoritas</h1>
          <div style={styles.menuUnderline} />
        </div>

        {listaFavoritas.length === 0 ? (
          <p style={styles.configSubLabel}>
            Aún no has marcado ninguna pregunta con ⭐. Puedes hacerlo desde cualquier
            pregunta durante el estudio.
          </p>
        ) : (
          <>
            <p style={styles.configSubLabel}>
              Tienes {listaFavoritas.length} pregunta{listaFavoritas.length === 1 ? "" : "s"}{" "}
              guardada{listaFavoritas.length === 1 ? "" : "s"}.
            </p>

            <button onClick={() => iniciarBloque(listaFavoritas)} style={styles.ctaButton}>
              Repasar favoritas
            </button>
          </>
        )}

        <button onClick={volverAProgreso} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // ⭐ REPASAR ERRORES
  if (vista === "errores") {
    const stats = obtenerStats();
    const muyOlvidadas = [];
    const pendientes = [];
    const recuperadas = [];

    preguntasBase.forEach((p) => {
      const s = stats[String(p.id)];
      if (!s) return;

      if (s.aciertos >= s.errores && s.errores > 0) {
        recuperadas.push(p);
      } else if (s.errores >= 3) {
        muyOlvidadas.push(p);
      } else if (s.errores > s.aciertos) {
        pendientes.push(p);
      }
    });

    return (
      <div style={styles.container}>
        <h1>⭐ Repasar errores</h1>

        <div style={{ border: "1px solid #ddd", padding: 15, marginTop: 10, borderRadius: 10 }}>
          <h3>🔴 Casos prioritarios ({muyOlvidadas.length})</h3>
          <p>Estas preguntas requieren de intervención urgente</p>
          <button style={styles.button} onClick={() => iniciarBloque(muyOlvidadas)}>
            Repasar
          </button>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 15, marginTop: 10, borderRadius: 10 }}>
          <h3>🟡 Casos en seguimiento ({pendientes.length})</h3>
          <p>Sigues con el expediente abierto</p>
          <button style={styles.button} onClick={() => iniciarBloque(pendientes)}>
            Repasar
          </button>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 15, marginTop: 10, borderRadius: 10 }}>
          <h3>🟢 Casos resueltos ({recuperadas.length})</h3>
          <p>Intervención finalizada: autonomía conseguida</p>
          <button style={styles.button} onClick={() => iniciarBloque(recuperadas)}>
            Repasar
          </button>
        </div>

        <button onClick={volverAProgreso} style={styles.button}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 📊 ESTADÍSTICAS
  if (vista === "estadisticas") {
    const statsGuardadas = obtenerStats();
    const bloques = {};

    Object.values(statsGuardadas).forEach((dato) => {
      const bloque = dato.bloque || "Sin bloque";
      if (!bloques[bloque]) bloques[bloque] = { respondidas: 0, aciertos: 0 };
      bloques[bloque].respondidas += dato.veces || 0;
      bloques[bloque].aciertos += dato.aciertos || 0;
    });

    function mensajeBloque(p) {
      if (p >= 90) return "🎓 Nivel Jane Addams: podrías montar tu propia Hull House";
      if (p >= 75) return "💪 Caso con alta autonomía, casi de alta";
      if (p >= 60) return "🙂 Vas bien, aunque el expediente aún tiene puntos abiertos";
      if (p >= 40) return "⚠️ Este bloque necesita un plan de intervención en condiciones";
      if (p >= 20) return "🚨 Caso de alta vulnerabilidad — hay que reforzar la red de apoyo (o sea, estudiar más)";
      return "🆘 Esto es una urgencia social: deriva este bloque a estudio inmediato";
    }

    const ordenados = Object.entries(bloques)
      .map(([nombre, datos]) => ({
        nombre,
        porcentaje: datos.respondidas ? Math.round((datos.aciertos / datos.respondidas) * 100) : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    const totalRespondidas = Object.values(statsGuardadas).reduce((a, b) => a + (b.veces || 0), 0);
    const totalAciertos = Object.values(statsGuardadas).reduce((a, b) => a + (b.aciertos || 0), 0);
    const porcentaje = totalRespondidas ? Math.round((totalAciertos / totalRespondidas) * 100) : 0;

    const racha = obtenerRacha().racha;
    const tiempos = obtenerTiempos();
    const tiempoMedio =
      tiempos.totalPreguntas > 0 ? Math.round(tiempos.totalSegundos / tiempos.totalPreguntas) : 0;
    const mejorBloque = ordenados.length > 0 ? ordenados[0] : null;
    const peorBloque = ordenados.length > 0 ? ordenados[ordenados.length - 1] : null;

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📊 Estadísticas</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={styles.statGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{totalRespondidas}</div>
            <div style={styles.statLabel}>Preguntas respondidas</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{porcentaje}%</div>
            <div style={styles.statLabel}>Aciertos</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{tiempoMedio ? `${tiempoMedio}s` : "—"}</div>
            <div style={styles.statLabel}>Tiempo medio / pregunta</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>🔥 {racha}</div>
            <div style={styles.statLabel}>Días seguidos estudiando</div>
          </div>
        </div>

        {mejorBloque && (
          <div style={{ ...styles.configCard, marginBottom: 10 }}>
            <p style={styles.configCardTitle}>🏆 Mejor bloque</p>
            <p style={styles.configSubLabel}>
              {mejorBloque.nombre} — {mejorBloque.porcentaje}% aciertos
            </p>
          </div>
        )}

        {peorBloque && peorBloque !== mejorBloque && (
          <div style={styles.configCard}>
            <p style={styles.configCardTitle}>🧐 Bloque a reforzar</p>
            <p style={styles.configSubLabel}>
              {peorBloque.nombre} — {peorBloque.porcentaje}% aciertos
            </p>
          </div>
        )}

        <h3 style={styles.bloquesTitle}>Rendimiento por bloque</h3>

        {ordenados.length === 0 ? (
          <p>Todavía no has respondido preguntas 😅</p>
        ) : (
          ordenados.map((b) => (
            <div
              key={b.nombre}
              style={{ border: "1px solid #ddd", padding: 10, marginTop: 10, borderRadius: 10, background: "#fff" }}
            >
              <h3>{b.nombre}</h3>
              <p>{b.porcentaje}% aciertos</p>
              <p>{mensajeBloque(b.porcentaje)}</p>
            </div>
          ))
        )}

        <button onClick={volverAProgreso} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 🟣 QUIZ
  if (vista === "quiz" && pregunta) {
    return (
      <div style={styles.container}>
        <button onClick={volverMenu} style={styles.button}>
          ⬅ Menú
        </button>

        {tiempoRestante !== null && (
          <p style={{ fontWeight: 700, color: "#e29aa0" }}>⏱ {formatearTiempo(tiempoRestante)}</p>
        )}

        <p>Pregunta {indice + 1} / {preguntas.length}</p>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "center" }}>
          <h3 style={{ margin: 0 }}>{pregunta.pregunta}</h3>
          <button
            onClick={() => toggleFavorito(pregunta.id)}
            title="Marcar como favorita"
            style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
          >
            {favoritos.includes(String(pregunta.id)) ? "⭐" : "☆"}
          </button>
        </div>

        {pregunta.respuestas.map((r, i) => {
          let bg = "#fff";
          if (mostrar) bg = i === pregunta.correcta ? "#d4edda" : "#f8d7da";

          return (
            <button
              key={i}
              onClick={() => comprobar(i)}
              disabled={mostrar}
              style={{
                ...styles.button,
                background: bg,
                textAlign: "left",
                lineHeight: 1.5,
                whiteSpace: "pre-line"
              }}
            >
              {formatearTextoLargo(r)}
            </button>
          );
        })}

        {mostrar && (
          <>
            <p>{mensaje}</p>

            {(() => {
              const s = obtenerStats()[String(pregunta.id)];
              if (!s) return null;

              const acertoAhora = mensaje === "✅ Correcto";

              if (acertoAhora) {
                if (s.errores >= 3) {
                  return <p>💪 Antes te costaba, pero hoy la has clavado.</p>;
                }
                return null;
              }

              if (s.errores >= 5) return <p>💀 Deja las cervezas y ponte a estudiar.</p>;
              if (s.errores >= 3) return <p>👀 Ya os estáis viendo demasiado tú y esta pregunta</p>;
              return null;
            })()}

            {conExplicacion && (
              <div style={styles.explicacionCaja}>
                <p style={{ margin: 0 }}>
                  <b>Explicación:</b>
                </p>
                {renderizarTextoConNegrita(pregunta.explicacion)}
              </div>
            )}

            <button onClick={siguiente} style={styles.button}>
              Siguiente →
            </button>
          </>
        )}
      </div>
    );
  }

  // Fin del bloque
  return (
    <div style={styles.container}>
      <h2>Fin del bloque</h2>
      <p>Aciertos: {aciertos} / {preguntas.length}</p>
      <button onClick={volverMenu} style={styles.button}>
        Volver al menú
      </button>
    </div>
  );
}