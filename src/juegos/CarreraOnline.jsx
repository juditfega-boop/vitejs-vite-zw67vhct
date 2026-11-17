import { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { styles, globalStyles } from "../estilos";
import {
  COLORES_CORREDORA,
  crearSala,
  unirseSala,
  vigilarSala,
  salirDeSala,
  borrarSala,
  cambiarConfig,
  empezarCarrera,
  guardarMiProgreso,
  terminarCarrera
} from "../servicios/salas";
import corredoraRosa from "../assets/kit/corredora-rosa.png";
import corredoraMorado from "../assets/kit/corredora-morado.png";
import corredoraVerde from "../assets/kit/corredora-verde.png";
import corredoraAmarillo from "../assets/kit/corredora-amarillo.png";

// 🎨 la imagen de cada corredora (más adelante aquí entrarán los avatares)
const IMAGEN_CORREDORA = {
  rosa: corredoraRosa,
  morado: corredoraMorado,
  verde: corredoraVerde,
  amarillo: corredoraAmarillo
};

const CLAVE_NOMBRE = "opo_carrera_nombre_v1";

// ⏳ si alguien se queda parada: 2 min de margen + 1 min de cuenta atrás
const ESPERA_INACTIVIDAD = 120;
const CUENTA_ATRAS = 60;
const MARGEN_SIN_CONEXION = 30; // por si su móvil se ha apagado
function mezclar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// solo lo necesario para jugar (sin explicaciones, para que la sala pese poco)
function prepararPregunta(p) {
  const respuestas = p.respuestas.map((r, i) => ({ texto: r, indexOriginal: i }));
  const mezcladas = mezclar(respuestas);
  return {
    pregunta: p.pregunta,
    respuestas: mezcladas.map((r) => r.texto),
    correcta: mezcladas.findIndex((r) => r.indexOriginal === p.correcta)
  };
}

function mensajeError(e) {
  if (e && e.code === "permission-denied")
    return "No se ha podido entrar en la partida. Comprueba que tu cuenta está aprobada.";
  if (e && e.code === "unavailable") return "Para jugar online necesitas conexión a internet.";
  return (e && e.message) || "Algo ha fallado. Inténtalo otra vez.";
}

const est = {
  franja: {
    background: "#f7f1e8",
    border: "1px solid #eadfcd",
    borderRadius: 22,
    padding: "10px 14px",
    margin: "10px 0 16px",
    position: "relative"
  },
  carril: { position: "relative", height: 46, borderBottom: "1px dashed #e2d6c2" },
  ficha: {
    position: "absolute",
    bottom: 2,
    height: 42,
    width: 34,
    objectFit: "contain",
    transition: "left 0.9s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  nombreCarril: { position: "absolute", right: 6, top: 3, fontSize: 11, color: "#8a8173" },
  meta: {
    position: "absolute",
    top: 8,
    bottom: 8,
    right: 10,
    borderRight: "3px dotted #d9b98a"
  },
  codigoGrande: {
    fontSize: 36,
    letterSpacing: 10,
    fontWeight: 700,
    color: "#5b4a3a",
    textAlign: "center",
    margin: "4px 0 6px"
  },
  fila: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f0e7da"
  },
  imgFila: { width: 40, height: 50, objectFit: "contain" },
  heroFila: { display: "flex", justifyContent: "center", gap: 6, margin: "6px 0 14px" },
  heroImg: { width: 56, height: 72, objectFit: "contain" },
  separador: { textAlign: "center", color: "#a39a8c", fontSize: 13, margin: "18px 0 6px" },
  error: { color: "#c96a6a", textAlign: "center", fontSize: 14, margin: "10px 0" },
  avisoParada: {
    background: "#f6e6e6",
    border: "1px solid #ecd0d0",
    borderRadius: 18,
    padding: "10px 14px",
    margin: "0 0 14px",
    textAlign: "center",
    color: "#8a5a5a",
    fontSize: 14
  }
};

// 🏃‍♀️ la franja de la plaza: cada corredora avanza según sus aciertos
function FranjaPlaza({ lista, total }) {
  return (
    <div style={est.franja}>
      <div style={est.meta} />
      {lista.map((j) => {
        const avance = total > 0 ? j.aciertos / total : 0;
        return (
          <div key={j.uid} style={est.carril}>
            <img
              src={IMAGEN_CORREDORA[j.color]}
              alt={j.nombre}
              style={{ ...est.ficha, left: `calc((100% - 50px) * ${avance})` }}
            />
            <span style={est.nombreCarril}>
              {j.nombre} · {j.aciertos}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CarreraOnline({ preguntasBase, volver, alTerminar }) {
  const uid = getAuth().currentUser?.uid;

  const [nombre, setNombre] = useState(() => localStorage.getItem(CLAVE_NOMBRE) || "");
  const [codigoEscrito, setCodigoEscrito] = useState("");
  const [codigo, setCodigo] = useState(null);
  const [sala, setSala] = useState(null);
  const [error, setError] = useState("");
  const [ocupada, setOcupada] = useState(false);
  const [seleccion, setSeleccion] = useState(null);
  const [indiceRespondido, setIndiceRespondido] = useState(0);
  const inicioRef = useRef(Date.now());
  const yaTerminadoRef = useRef(false);
  const ultimaAccionRef = useRef(Date.now());
  const vistoRef = useRef({});
  const cortadaRef = useRef(false);
  const [ahora, setAhora] = useState(Date.now());
  // 👀 escuchar la sala en directo
  useEffect(() => {
    if (!codigo) return;
    const dejar = vigilarSala(
      codigo,
      (datos) => {
        if (!datos) {
          setError("La partida se ha cerrado.");
          setCodigo(null);
          setSala(null);
          return;
        }
        if (!datos.jugadoras || !datos.jugadoras[uid]) {
          setCodigo(null);
          setSala(null);
          return;
        }
        setSala(datos);
      },
      (e) => setError(mensajeError(e))
    );
    return dejar;
  }, [codigo, uid]);

  const lista = useMemo(() => {
    if (!sala || !sala.jugadoras) return [];
    return Object.entries(sala.jugadoras)
      .map(([id, j]) => ({ uid: id, ...j }))
      .sort((a, b) => COLORES_CORREDORA.indexOf(a.color) - COLORES_CORREDORA.indexOf(b.color));
  }, [sala]);

  const soyAnfitriona = !!sala && sala.anfitriona === uid;
  const total = (sala && sala.preguntas && sala.preguntas.length) || 0;
  const yo = sala && sala.jugadoras ? sala.jugadoras[uid] : null;
  const todasTerminadas =
    !!sala && sala.estado === "jugando" && lista.length > 0 && lista.every((j) => j.terminada);
  const acabada = !!sala && (sala.estado === "terminada" || todasTerminadas);

  useEffect(() => {
    if (sala && sala.estado === "jugando") {
      inicioRef.current = Date.now();
      ultimaAccionRef.current = Date.now();
      vistoRef.current = {};
    }
  }, [sala && sala.estado]);

  // ⏱️ reloj de la carrera (cada segundo, solo mientras se juega)
  useEffect(() => {
    if (!sala || sala.estado !== "jugando") return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sala && sala.estado]);

  // 👀 apuntar cuándo ha respondido cada una por última vez
  useEffect(() => {
    lista.forEach((j) => {
      const visto = vistoRef.current[j.uid];
      if (!visto || visto.respondidas !== j.respondidas) {
        vistoRef.current[j.uid] = { respondidas: j.respondidas, desde: Date.now() };
      }
    });
  }, [lista]);

  const misSegundosParada = Math.floor((ahora - ultimaAccionRef.current) / 1000);
  const miCuentaAtras =
    sala && sala.estado === "jugando" && yo && !yo.terminada && misSegundosParada >= ESPERA_INACTIVIDAD
      ? Math.max(0, ESPERA_INACTIVIDAD + CUENTA_ATRAS - misSegundosParada)
      : null;

  function segundosParada(j) {
    const visto = vistoRef.current[j.uid];
    return visto ? Math.floor((ahora - visto.desde) / 1000) : 0;
  }

  // ⌛ si se me acaba la cuenta atrás, llego a la meta con lo que llevo
  useEffect(() => {
    if (miCuentaAtras !== 0 || cortadaRef.current) return;
    cortadaRef.current = true;
    setSeleccion(null);
    guardarMiProgreso(codigo, uid, { ...yo, terminada: true, porTiempo: true }).catch((e) =>
      setError(mensajeError(e))
    );
  }, [miCuentaAtras]);

  // 🛟 red de seguridad: si a alguien se le apaga el móvil o pierde la conexión,
  // el móvil de la anfitriona la da por llegada cuando pasa su tiempo (+ un margen)
  useEffect(() => {
    if (!soyAnfitriona || !sala || sala.estado !== "jugando") return;
    lista.forEach((j) => {
      if (j.uid === uid || j.terminada) return;
      if (segundosParada(j) >= ESPERA_INACTIVIDAD + CUENTA_ATRAS + MARGEN_SIN_CONEXION) {
        const { uid: idJugadora, ...datos } = j;
        guardarMiProgreso(codigo, idJugadora, { ...datos, terminada: true, porTiempo: true }).catch(() => {});
      }
    });
  }, [ahora]);

  // 🏁 cuando llegan todas (o la anfitriona la cierra) → clasificación con el vídeo
  useEffect(() => {
    if (!acabada || yaTerminadoRef.current) return;
    yaTerminadoRef.current = true;
    if (soyAnfitriona && sala.estado !== "terminada") terminarCarrera(codigo).catch(() => {});
    alTerminar(
      lista.map((j) => ({
        nombre: j.nombre,
        aciertos: j.aciertos,
        errores: j.errores,
        tiempoTotal: j.tiempoTotal,
        fallos: j.fallos || []
      }))
    );
  }, [acabada]);

  function nombreLimpio() {
    const n = nombre.trim().slice(0, 20);
    if (n) localStorage.setItem(CLAVE_NOMBRE, n);
    return n;
  }

  async function crear() {
    const n = nombreLimpio();
    if (!n) return setError("Escribe tu nombre primero.");
    setOcupada(true);
    setError("");
    try {
      setCodigo(await crearSala(uid, n));
    } catch (e) {
      setError(mensajeError(e));
    }
    setOcupada(false);
  }

  async function unirse() {
    const n = nombreLimpio();
    if (!n) return setError("Escribe tu nombre primero.");
    const c = codigoEscrito.trim().toUpperCase();
    if (c.length !== 4) return setError("El código tiene 4 caracteres.");
    setOcupada(true);
    setError("");
    try {
      await unirseSala(c, uid, n);
      setCodigo(c);
    } catch (e) {
      setError(mensajeError(e));
    }
    setOcupada(false);
  }

  async function salir() {
    const c = codigo;
    const borrar = soyAnfitriona && sala && sala.estado === "espera";
    setCodigo(null);
    setSala(null);
    try {
      if (borrar) await borrarSala(c);
      else await salirDeSala(c, uid);
    } catch (e) {
      // si falla al salir no pasa nada: la sala se queda sin usar
    }
  }

  function actualizarConfig(cambios) {
    cambiarConfig(codigo, { ...sala.config, ...cambios }).catch((e) => setError(mensajeError(e)));
  }

  function preguntasFuente(config) {
    if (config.tipo !== "bloques") return preguntasBase;
    return preguntasBase.filter((p) => config.bloques.includes(p.bloque || "Sin bloque"));
  }

  function empezar() {
    const preguntas = mezclar(preguntasFuente(sala.config))
      .slice(0, sala.config.numPreguntas)
      .map(prepararPregunta);
    empezarCarrera(codigo, preguntas).catch((e) => setError(mensajeError(e)));
  }

  function responder(i) {
    if (seleccion !== null || !yo) return;
    const idx = yo.respondidas;
    const p = sala.preguntas[idx];
    if (!p) return;
    setSeleccion(i);
    setIndiceRespondido(idx);
    ultimaAccionRef.current = Date.now();

    const esCorrecta = i === p.correcta;
    const respondidas = idx + 1;
    guardarMiProgreso(codigo, uid, {
      ...yo,
      aciertos: yo.aciertos + (esCorrecta ? 1 : 0),
      errores: yo.errores + (esCorrecta ? 0 : 1),
      respondidas,
      tiempoTotal: (yo.tiempoTotal || 0) + (Date.now() - inicioRef.current),
      terminada: respondidas >= total,
      fallos: esCorrecta
        ? yo.fallos || []
        : [
            ...(yo.fallos || []),
            { pregunta: p.pregunta, respuestaDada: p.respuestas[i], correcta: p.respuestas[p.correcta] }
          ]
    }).catch((e) => setError(mensajeError(e)));
  }

  function siguiente() {
    setSeleccion(null);
    inicioRef.current = Date.now();
    ultimaAccionRef.current = Date.now();
  }

  // ─────────── sin sesión ───────────
  if (!uid) {
    return (
      <div style={styles.menuContainer}>
        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <p style={styles.configCardTitle}>Para jugar online tienes que entrar con tu cuenta.</p>
        </div>
        <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>
      </div>
    );
  }

  // ─────────── entrar: crear o unirse ───────────
  if (!codigo) {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Carrera online</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={est.heroFila}>
          {COLORES_CORREDORA.map((c) => (
            <img key={c} src={IMAGEN_CORREDORA[c]} alt="" style={est.heroImg} />
          ))}
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Tu nombre en la carrera</p>
          <input
            type="text"
            value={nombre}
            maxLength={20}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Cómo quieres que te vean"
            style={styles.nombreInput}
          />
        </div>

        <button
          onClick={crear}
          disabled={ocupada}
          style={{ ...styles.ctaButton, ...(ocupada ? styles.ctaButtonDisabled : {}) }}
        >
          Crear partida
        </button>

        <p style={est.separador}>o únete con el código que te pasen</p>

        <div style={styles.configCard}>
          <input
            type="text"
            value={codigoEscrito}
            maxLength={4}
            onChange={(e) => setCodigoEscrito(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            style={{ ...styles.nombreInput, textAlign: "center", letterSpacing: 6, fontWeight: 700 }}
          />
          <button
            onClick={unirse}
            disabled={ocupada}
            style={{ ...styles.ctaButton, marginTop: 10, ...(ocupada ? styles.ctaButtonDisabled : {}) }}
          >
            Unirme
          </button>
        </div>

        {error && <p style={est.error}>{error}</p>}

        <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>
      </div>
    );
  }

  if (!sala) {
    return (
      <div style={styles.menuContainer}>
        <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 40 }}>
          Entrando en la partida…
        </p>
      </div>
    );
  }

  if (acabada) {
    return (
      <div style={styles.menuContainer}>
        <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 40 }}>
          Preparando la clasificación…
        </p>
      </div>
    );
  }

  // ─────────── sala de espera ───────────
  if (sala.estado === "espera") {
    const config = sala.config;
    const bloques = [...new Set(preguntasBase.map((p) => p.bloque || "Sin bloque"))];
    const disponibles = preguntasFuente(config).length;
    const suficientes = disponibles >= config.numPreguntas;
    const puedeEmpezar =
      lista.length >= 2 && (config.tipo === "general" || config.bloques.length > 0) && suficientes;

    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>Sala de espera</h1>
          <div style={styles.menuUnderline} />
        </div>

        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <p style={styles.configSubLabel}>Código de la partida</p>
          <p style={est.codigoGrande}>{codigo}</p>
          <p style={styles.configSubLabel}>Pásaselo a tus compañeras para que se unan</p>
        </div>

        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Corredoras ({lista.length}/4)</p>
          {lista.map((j) => (
            <div key={j.uid} style={est.fila}>
              <img src={IMAGEN_CORREDORA[j.color]} alt="" style={est.imgFila} />
              <span>
                {j.nombre}
                {j.uid === sala.anfitriona ? " · anfitriona" : ""}
                {j.uid === uid ? " (tú)" : ""}
              </span>
            </div>
          ))}
          {lista.length < 2 && (
            <p style={{ ...styles.configSubLabel, marginTop: 8 }}>Hace falta al menos una persona más.</p>
          )}
        </div>

        {soyAnfitriona ? (
          <>
            <div style={styles.configCard}>
              <p style={styles.configCardTitle}>Preguntas</p>
              <div style={styles.pillGroup}>
                {[
                  ["general", "General"],
                  ["bloques", "Por bloques"]
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    className="pill"
                    onClick={() => actualizarConfig({ tipo: valor })}
                    style={{ ...styles.pillBtn, ...(config.tipo === valor ? styles.pillBtnActiva : {}) }}
                  >
                    {texto}
                  </button>
                ))}
              </div>
              {config.tipo === "bloques" && (
                <div style={styles.bloquesGrid}>
                  {bloques.map((b) => (
                    <button
                      key={b}
                      className="bloque-chip"
                      onClick={() =>
                        actualizarConfig({
                          bloques: config.bloques.includes(b)
                            ? config.bloques.filter((x) => x !== b)
                            : [...config.bloques, b]
                        })
                      }
                      style={{
                        ...styles.bloqueChip,
                        ...(config.bloques.includes(b) ? styles.bloqueChipActiva : {})
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.configCard}>
              <p style={styles.configCardTitle}>Preguntas por persona</p>
              <div style={styles.pillGroup}>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    className="pill"
                    onClick={() => actualizarConfig({ numPreguntas: n })}
                    style={{ ...styles.pillBtn, ...(config.numPreguntas === n ? styles.pillBtnActiva : {}) }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {!suficientes && (
                <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 8 }}>
                  No hay preguntas suficientes ({disponibles} disponibles). Baja el número o elige más bloques.
                </p>
              )}
            </div>

            <button
              onClick={empezar}
              disabled={!puedeEmpezar}
              style={{ ...styles.ctaButton, ...(puedeEmpezar ? {} : styles.ctaButtonDisabled) }}
            >
              🚩 Empezar carrera
            </button>
          </>
        ) : (
          <div style={{ ...styles.configCard, textAlign: "center" }}>
            <p style={styles.configSubLabel}>
              {config.tipo === "bloques"
                ? `Por bloques: ${config.bloques.join(", ") || "sin elegir todavía"}`
                : "Preguntas generales"}{" "}
              · {config.numPreguntas} preguntas
            </p>
            <p style={{ ...styles.configSubLabel, marginTop: 6 }}>
              Esperando a que la anfitriona dé la salida…
            </p>
          </div>
        )}

        {error && <p style={est.error}>{error}</p>}

        <button onClick={salir} style={styles.linkVolver}>
          {soyAnfitriona ? "Cerrar la partida" : "Salir de la partida"}
        </button>
      </div>
    );
  }

  // ─────────── he llegado: esperando a las demás ───────────
  if (yo && yo.terminada && seleccion === null) {
    const quedan = lista.filter((j) => !j.terminada);
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>¡Has llegado!</h1>
          <div style={styles.menuUnderline} />
        </div>

        <FranjaPlaza lista={lista} total={total} />

        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <img src={IMAGEN_CORREDORA[yo.color]} alt="" style={{ ...est.heroImg, width: 70, height: 90 }} />
          <p style={styles.configCardTitle}>
            {yo.aciertos} de {total} aciertos
          </p>
          {yo.porTiempo && (
            <p style={styles.configSubLabel}>Se acabó tu tiempo: cuenta lo que llevabas respondido.</p>
          )}
          <p style={styles.configSubLabel}>Esperando a que lleguen las demás…</p>
          {quedan.map((j) => {
            const parada = segundosParada(j);
            const restante = ESPERA_INACTIVIDAD + CUENTA_ATRAS - parada;
            return (
              <p key={j.uid} style={{ ...styles.configSubLabel, marginTop: 4 }}>
                {j.nombre} va por la {Math.min(j.respondidas + 1, total)} de {total}
                {parada >= ESPERA_INACTIVIDAD &&
                  (restante > 0
                    ? ` · lleva un rato parada, le quedan unos ${restante} s`
                    : " · comprobando si sigue conectada…")}
              </p>
            );
          })}
        </div>

        {error && <p style={est.error}>{error}</p>}
      </div>
    );
  }

  // ─────────── jugando ───────────
  const indice = seleccion !== null ? indiceRespondido : yo ? yo.respondidas : 0;
  const p = sala.preguntas[indice];
  if (!p) return null;

  function estiloRespuesta(i) {
    if (seleccion === null) return styles.simRespuestaBtn;
    if (i === p.correcta) return { ...styles.simRespuestaBtn, background: "#e6eedb", borderColor: "#9db584" };
    if (i === seleccion) return { ...styles.simRespuestaBtn, background: "#f6e0e0", borderColor: "#d9a0a0" };
    return { ...styles.simRespuestaBtn, opacity: 0.55 };
  }

  return (
    <div style={styles.menuContainer}>
      <div style={styles.simHeaderBar}>
        <span style={styles.simTimer}>
          Pregunta {indice + 1} / {total}
        </span>
        <span style={styles.simTimer}>{codigo}</span>
      </div>

      <FranjaPlaza lista={lista} total={total} />

      {miCuentaAtras !== null && (
        <div style={est.avisoParada}>
          <b>¿Sigues ahí?</b>
          <br />
          Si no respondes en {miCuentaAtras} s, llegarás a la meta con lo que llevas.
        </div>
      )}

      <h3>{p.pregunta}</h3>

      {p.respuestas.map((r, i) => (
        <button key={i} onClick={() => responder(i)} disabled={seleccion !== null} style={estiloRespuesta(i)}>
          {r}
        </button>
      ))}

      {seleccion !== null && (
        <>
          <p style={{ textAlign: "center", fontWeight: 700, color: seleccion === p.correcta ? "#6a9a6a" : "#c96a6a" }}>
            {seleccion === p.correcta ? "¡Bien! Avanzas una casilla" : "Esta no era"}
          </p>
          <button onClick={siguiente} style={styles.ctaButton}>
            {indice + 1 >= total ? "Llegar a la meta" : "Siguiente pregunta"}
          </button>
        </>
      )}

      {error && <p style={est.error}>{error}</p>}

      {seleccion === null && (
        <button
          onClick={() => {
            if (window.confirm("¿Abandonar la carrera?")) salir();
          }}
          style={styles.linkVolver}
        >
          Abandonar
        </button>
      )}
    </div>
  );
}