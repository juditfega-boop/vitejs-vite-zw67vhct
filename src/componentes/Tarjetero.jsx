import { useEffect, useRef, useState } from "react";
import { styles } from "../estilos";
import { TituloHub, COLOR_SECCION } from "./Hub";
import { marcarRacion } from "../servicios/progreso";
import {
  listarCarpetas,
  crearCarpeta,
  renombrarCarpeta,
  borrarCarpeta,
  listarTarjetas,
  anadirTarjeta,
  borrarTarjeta,
  intercambiarOrden,
  cambiarTitulo
} from "../servicios/tarjetero";
import { comprimirImagen } from "../servicios/comprimirImagen";
import { leerCurva, entrarEnCurva, apuntarRepaso, claveDia } from "../servicios/curva";

// "2026-11-26" → "jueves 26 de noviembre"
function fechaBonita(clave) {
  if (!clave) return "";
  const [a, m, d] = clave.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

// "3 - Órganos colegiados.png" → "Órganos colegiados"
function tituloDesdeArchivo(nombre) {
  return (nombre || "")
    .replace(/\.[^.]+$/, "")
    .replace(/^\s*\d+\s*[-_.)·]*\s*/, "")
    .replace(/_+/g, " ")
    .trim();
}

// días desde hoy hasta una fecha "2026-12-03" (0 = hoy o ya pasada)
function diasHasta(clave) {
  const [a, m, d] = clave.split("-").map(Number);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((new Date(a, m - 1, d) - hoy) / 86400000));
}

const botonNota = {
  flex: 1,
  border: "none",
  borderRadius: 16,
  padding: "12px 6px",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 700,
  color: "#4a4038",
  cursor: "pointer"
};

const tarjetaBase = {
  background: "#fffcf7",
  borderRadius: 22,
  boxShadow: "0 2px 10px rgba(120,100,70,0.06)"
};

const botonPequeno = {
  fontFamily: "inherit",
  fontSize: 13,
  color: "#5b4a3a",
  background: "#f3ede3",
  border: "none",
  borderRadius: 999,
  padding: "6px 12px",
  cursor: "pointer"
};

// 🗂️ "Mi tarjetero": carpetas con tarjetas-resumen en imagen (privadas de cada cuenta)
export default function Tarjetero({ volver }) {
  const [vista, setVista] = useState("carpetas"); // carpetas | carpeta | visor
  const [carpetas, setCarpetas] = useState(null);
  const [carpeta, setCarpeta] = useState(null);
  const [tarjetas, setTarjetas] = useState(null);
  const [indice, setIndice] = useState(0);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false); // ventanita de «Nueva carpeta»
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  const toqueInicio = useRef(null);
  // 🌿 sellar: tarjetas pendientes, si la actual está destapada y la primera nota de cada una
  const [curva, setCurva] = useState(null); // { idCarpeta: { paso, proxima } }
  const [cola, setCola] = useState([]);
  const [fase, setFase] = useState("mirar"); // mirar | tapada | destapada
  const [notas, setNotas] = useState({});
  const [finSellado, setFinSellado] = useState(null);

  async function cargarCarpetas() {
    try {
      setCarpetas(await listarCarpetas());
    } catch (e) {
      console.error(e);
      setCarpetas([]);
      setMensaje("No se pudieron cargar tus carpetas.");
    }
  }

  async function cargarTarjetas(c) {
    setTarjetas(null);
    try {
      setTarjetas(await listarTarjetas(c.id));
    } catch (e) {
      console.error(e);
      setTarjetas([]);
      setMensaje("No se pudieron cargar las tarjetas.");
    }
  }

  useEffect(() => {
    cargarCarpetas();
    cargarCurva();
  }, []);

  function cargarCurva() {
    leerCurva()
      .then((c) => setCurva(c.tarjetero || {}))
      .catch((e) => {
        console.error(e);
        setCurva({});
      });
  }

  function empezarSellado() {
    setCola(tarjetas.map((_, i) => i));
    setNotas({});
    setFase(curva && curva[carpeta.id] ? "tapada" : "mirar");
    setFinSellado(null);
    setVista("sellar");
  }

  // sellada → fuera · casi / no → vuelve al final de la tanda
  function marcar(nota) {
    const [i, ...resto] = cola;
    const primeras = notas[i] ? notas : { ...notas, [i]: nota };
    setNotas(primeras);
    const nuevaCola = nota === "sellada" ? resto : [...resto, i];
    if (nuevaCola.length > 0) {
      setCola(nuevaCola);
      // la primera vez que sellas la carpeta, cada tarjeta nueva se mira antes; las que vuelven, ya tapadas
      const primeraVez = !(curva && curva[carpeta.id]);
      setFase(primeraVez && !primeras[nuevaCola[0]] ? "mirar" : "tapada");
    } else terminarSellado(primeras);
  }

  async function terminarSellado(primeras) {
    const valores = Object.values(primeras);
    const resultado = valores.includes("no") ? "mal" : valores.includes("casi") ? "casi" : "bien";
    const yaEstaba = !!(curva && curva[carpeta.id]);
    let proxima = null;
    try {
      if (yaEstaba) await apuntarRepaso("tarjetero", carpeta.id, resultado);
      else await entrarEnCurva("tarjetero", carpeta.id);
      const c = await leerCurva();
      setCurva(c.tarjetero || {});
      proxima = (c.tarjetero || {})[carpeta.id]?.proxima || null;
    } catch (e) {
      console.error(e);
    }
    marcarRacion("tarjetero"); // 🍲 cuenta para la ración de hoy
    setCola([]);
    setFinSellado({ resultado, yaEstaba, proxima });
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [vista]);

  function abrirCarpeta(c) {
    setCarpeta(c);
    setEditando(false);
    setMensaje("");
    setVista("carpeta");
    cargarTarjetas(c);
  }

  async function nuevaCarpeta() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    setOcupado(true);
    try {
      await crearCarpeta(nombre);
      setNuevoNombre("");
      setCreando(false);
      await cargarCarpetas();
    } catch (e) {
      console.error(e);
      setMensaje("No se pudo crear la carpeta.");
    }
    setOcupado(false);
  }

  async function subirTarjetas(e) {
    const archivos = [...(e.target.files || [])].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { numeric: true })
    );
    e.target.value = "";
    if (archivos.length === 0) return;

    setOcupado(true);
    let orden = tarjetas && tarjetas.length ? Math.max(...tarjetas.map((t) => t.orden || 0)) + 1 : 0;
    try {
      for (let i = 0; i < archivos.length; i++) {
        setMensaje(`Subiendo ${i + 1} de ${archivos.length}…`);
        const imagen = await comprimirImagen(archivos[i]);
        await anadirTarjeta(carpeta.id, imagen, orden, tituloDesdeArchivo(archivos[i].name));
        orden += 1;
      }
      setMensaje(`🌿 ${archivos.length === 1 ? "Tarjeta añadida" : `${archivos.length} tarjetas añadidas`}.`);
    } catch (err) {
      console.error(err);
      setMensaje("⚠️ Alguna tarjeta no se pudo subir. Prueba con una imagen más pequeña.");
    }
    await cargarTarjetas(carpeta);
    setOcupado(false);
  }

  async function quitarTarjeta(t) {
    if (!window.confirm("¿Borrar esta tarjeta? No se puede deshacer.")) return;
    setOcupado(true);
    try {
      await borrarTarjeta(carpeta.id, t.id);
      await cargarTarjetas(carpeta);
    } catch (e) {
      console.error(e);
      setMensaje("No se pudo borrar la tarjeta.");
    }
    setOcupado(false);
  }

  async function ponerTitulo(t) {
    const titulo = window.prompt("Título de la tarjeta:", t.titulo || "");
    if (titulo === null) return;
    try {
      await cambiarTitulo(carpeta.id, t.id, titulo.trim());
      await cargarTarjetas(carpeta);
    } catch (e) {
      console.error(e);
      setMensaje("No se pudo cambiar el título.");
    }
  }

  async function mover(i, direccion) {
    const j = i + direccion;
    if (!tarjetas || j < 0 || j >= tarjetas.length) return;
    setOcupado(true);
    try {
      await intercambiarOrden(carpeta.id, tarjetas[i], tarjetas[j]);
      await cargarTarjetas(carpeta);
    } catch (e) {
      console.error(e);
      setMensaje("No se pudo cambiar el orden.");
    }
    setOcupado(false);
  }

  async function cambiarNombre() {
    const nombre = window.prompt("Nuevo nombre de la carpeta:", carpeta.nombre);
    if (!nombre || !nombre.trim()) return;
    try {
      await renombrarCarpeta(carpeta.id, nombre.trim());
      setCarpeta({ ...carpeta, nombre: nombre.trim() });
      cargarCarpetas();
    } catch (e) {
      console.error(e);
      setMensaje("No se pudo cambiar el nombre.");
    }
  }

  async function eliminarCarpeta() {
    if (!window.confirm(`¿Borrar la carpeta "${carpeta.nombre}" y todas sus tarjetas? No se puede deshacer.`)) return;
    setOcupado(true);
    try {
      await borrarCarpeta(carpeta.id);
      await cargarCarpetas();
      setVista("carpetas");
    } catch (e) {
      console.error(e);
      setMensaje("No se pudo borrar la carpeta.");
    }
    setOcupado(false);
  }

  // 👆 deslizar con el dedo en el visor
  function alTocar(e) {
    toqueInicio.current = e.touches[0].clientX;
  }
  function alSoltar(e) {
    if (ampliada || toqueInicio.current === null) return;
    const delta = e.changedTouches[0].clientX - toqueInicio.current;
    toqueInicio.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) setIndice((i) => Math.min(tarjetas.length - 1, i + 1));
    else setIndice((i) => Math.max(0, i - 1));
  }

  // 📁 LISTA DE CARPETAS
  if (vista === "carpetas") {
    // etiqueta de cada carpeta: hoy · en X días · sin sellar (las de hoy, primero; luego por fecha)
    const hoy = claveDia();
    const lista = (carpetas || [])
      .map((c) => {
        const fecha = curva && curva[c.id] ? curva[c.id].proxima : null;
        const dias = fecha ? (fecha <= hoy ? 0 : diasHasta(fecha)) : null;
        return { ...c, dias };
      })
      .sort((a, b) => (a.dias === null ? 9999 : a.dias) - (b.dias === null ? 9999 : b.dias));
    const paraHoy = lista.filter((c) => c.dias === 0).length;

    function etiqueta(dias) {
      if (dias === null) return { texto: "sin sellar", fondo: "#f8e6e8", color: "#8c5560" };
      if (dias === 0) return { texto: "🌿 Hoy", fondo: "#e3ecd9", color: "#3f5a3a", negrita: true };
      return { texto: dias === 1 ? "mañana" : `en ${dias} días`, fondo: "#f3ede3", color: "#7d7468" };
    }

    return (
      <div style={styles.menuContainer}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <TituloHub
            titulo="Mi tarjetero"
            subtitulo={
              paraHoy > 0
                ? `${paraHoy} ${paraHoy === 1 ? "carpeta para repasar hoy" : "carpetas para repasar hoy"}.`
                : "Tus resúmenes, ordenados en carpetas."
            }
            color={COLOR_SECCION.expediente.linea}
          />
          <button
            onClick={() => setCreando(true)}
            aria-label="Nueva carpeta"
            title="Nueva carpeta"
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              marginTop: 6,
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
              color: "#5a4636",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}
          >
            +
          </button>
        </div>

        {carpetas === null && <p style={styles.configSubLabel}>Cargando…</p>}
        {carpetas && carpetas.length === 0 && (
          <p style={{ ...styles.configSubLabel, textAlign: "center" }}>Todavía no tienes carpetas. Crea la primera con el +.</p>
        )}

        {lista.map((c) => {
          const e = etiqueta(c.dias);
          return (
            <button
              key={c.id}
              onClick={() => abrirCarpeta(c)}
              style={{
                ...tarjetaBase,
                width: "100%",
                boxSizing: "border-box",
                border: "none",
                borderLeft: c.dias === 0 ? "5px solid #9fbf8f" : "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                padding: "12px 16px",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#4a4038"
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11.5,
                    padding: "2px 9px",
                    borderRadius: 999,
                    background: e.fondo,
                    color: e.color,
                    fontWeight: e.negrita ? 700 : 400,
                    marginBottom: 5
                  }}
                >
                  {e.texto}
                </span>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{c.nombre}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginTop: 2 }}>
                  {c.total || 0} {c.total === 1 ? "tarjeta" : "tarjetas"}
                </span>
              </span>
              <span style={{ color: "#b8a993", fontSize: 18 }}>›</span>
            </button>
          );
        })}

        {mensaje && <p style={{ ...styles.configSubLabel, textAlign: "center" }}>{mensaje}</p>}

        <button onClick={volver} style={styles.linkVolver}><span className="hoja-volver"></span> Volver</button>

        {/* ➕ ventanita para crear una carpeta */}
        {creando && (
          <div
            onClick={() => setCreando(false)}
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
                color: "#4a463f"
              }}
            >
              <p style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, margin: "0 0 10px", fontSize: 28, lineHeight: 1, color: "#5b4a3a" }}>
                Nueva carpeta
              </p>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nuevaCarpeta()}
                placeholder="Ej: Ley 39/2015"
                autoFocus
                style={{ ...styles.nombreInput, width: "100%", boxSizing: "border-box" }}
              />
              <button
                onClick={nuevaCarpeta}
                disabled={ocupado || !nuevoNombre.trim()}
                style={{ ...styles.ctaButton, ...(ocupado || !nuevoNombre.trim() ? styles.ctaButtonDisabled : {}) }}
              >
                Crear carpeta
              </button>
              <button onClick={() => setCreando(false)} style={styles.linkVolver}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }


  // 🗂️ DENTRO DE UNA CARPETA
  if (vista === "carpeta") {
    return (
      <div style={styles.menuContainer}>
        <button onClick={() => setVista("carpetas")} style={styles.linkVolver}><span className="hoja-volver"></span> Mi tarjetero</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 14px" }}>
          <h1 style={{ ...styles.menuTitle, margin: 0, flex: 1 }}>{carpeta.nombre}</h1>
          <button onClick={() => setEditando((v) => !v)} style={botonPequeno}>
            {editando ? "Listo" : "Editar"}
          </button>
        </div>

        {editando && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button onClick={cambiarNombre} style={botonPequeno}>Cambiar nombre</button>
            <button onClick={eliminarCarpeta} style={{ ...botonPequeno, background: "#f9e3e3" }}>Borrar carpeta</button>
          </div>
        )}

        {tarjetas === null && <p style={styles.configSubLabel}>Cargando tarjetas…</p>}
        {tarjetas && tarjetas.length === 0 && (
          <p style={{ ...styles.configSubLabel, textAlign: "center" }}>Esta carpeta está vacía. Añade tus tarjetas aquí abajo.</p>
        )}

        {tarjetas && tarjetas.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 14 }}>
            {tarjetas.map((t, i) => (
              <div key={t.id} style={{ ...tarjetaBase, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  onClick={() => {
                    setIndice(i);
                    setAmpliada(false);
                    setVista("visor");
                  }}
                  style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer" }}
                  aria-label={`Abrir tarjeta ${i + 1}`}
                >
                  <img
                    src={t.imagen}
                    alt=""
                    style={{ width: "100%", height: 120, objectFit: "cover", objectPosition: "top", borderRadius: 14, display: "block" }}
                  />
                </button>
                <span style={{ fontSize: 12, color: t.titulo ? "#4a4038" : "#a99c8c", lineHeight: 1.3, padding: "0 2px" }}>
                  {t.titulo || "Sin título"}
                </span>
                {editando && (
                  <button onClick={() => ponerTitulo(t)} disabled={ocupado} style={{ ...botonPequeno, padding: "4px 8px" }}>
                    {t.titulo ? "Cambiar título" : "Poner título"}
                  </button>
                )}
                {editando && (
                  <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
                    <button onClick={() => mover(i, -1)} disabled={ocupado || i === 0} style={{ ...botonPequeno, padding: "4px 8px" }} aria-label="Mover antes">‹</button>
                    <button onClick={() => quitarTarjeta(t)} disabled={ocupado} style={{ ...botonPequeno, padding: "4px 8px", background: "#f9e3e3" }}>Borrar</button>
                    <button onClick={() => mover(i, 1)} disabled={ocupado || i === tarjetas.length - 1} style={{ ...botonPequeno, padding: "4px 8px" }} aria-label="Mover después">›</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

{tarjetas && tarjetas.length > 0 && !editando && (
          <div style={{ ...tarjetaBase, padding: "14px 16px", marginBottom: 14, background: "#f3f7ee" }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#4a4038" }}>Sellar esta carpeta</p>
            <p style={{ ...styles.configSubLabel, margin: "0 0 10px" }}>
              {!curva || !curva[carpeta.id]
                ? "Cada tarjeta sale difuminada: recita lo que recuerdes, destápala y comprueba."
                : curva[carpeta.id].proxima <= claveDia()
                ? "🌿 Hoy te toca repasarla."
                : `Sellada. Vuelve el ${fechaBonita(curva[carpeta.id].proxima)}.`}
            </p>
            <button onClick={empezarSellado} style={{ ...styles.ctaButton, margin: 0 }}>
              {curva && curva[carpeta.id] ? "Repasar ahora" : "Empezar a sellar"}
            </button>
          </div>
        )}

        <label
          style={{
            ...styles.ctaButton,
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            textAlign: "center",
            cursor: ocupado ? "default" : "pointer",
            ...(ocupado ? styles.ctaButtonDisabled : {})
          }}
        >
          {ocupado ? "Un momento…" : "Añadir tarjetas"}
          <input type="file" accept="image/*" multiple onChange={subirTarjetas} disabled={ocupado} style={{ display: "none" }} />
        </label>
        <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
          Puedes elegir varias imágenes a la vez: se ordenan por el nombre del archivo.
        </p>

        {mensaje && <p style={{ ...styles.configSubLabel, textAlign: "center" }}>{mensaje}</p>}
      </div>
    );
  }

  // 🌿 SELLAR UNA CARPETA
  if (vista === "sellar") {
    if (finSellado) {
      const textos = {
        bien: "Lo recuerdas todo.",
        casi: "Casi. Algunas se resistieron un poco.",
        mal: "Alguna se te estaba olvidando. Sin drama: vuelve pronto."
      };
      return (
        <div style={styles.menuContainer}>
          <div style={{ ...tarjetaBase, padding: 20, textAlign: "center", marginTop: 20 }}>
            <p style={{ fontSize: 34, margin: "0 0 6px" }}>🌿</p>
            <h2 style={{ ...styles.menuTitle, fontSize: 26, margin: "0 0 8px" }}>¡Carpeta sellada!</h2>
            <p style={{ ...styles.configSubLabel, margin: 0 }}>
              {finSellado.yaEstaba ? textos[finSellado.resultado] + " " : ""}
              {finSellado.proxima ? `Te la vuelvo a pedir el ${fechaBonita(finSellado.proxima)}.` : ""}
            </p>
          </div>
          <button onClick={() => setVista("carpeta")} style={styles.ctaButton}>
            Volver a {carpeta.nombre}
          </button>
        </div>
      );
    }

    const i = cola[0];
    const tarjeta = tarjetas && tarjetas[i];
    return (
      <div style={styles.menuContainer}>
        <button onClick={() => setVista("carpeta")} style={styles.linkVolver}><span className="hoja-volver"></span> {carpeta.nombre}</button>
        <p style={{ ...styles.configSubLabel, textAlign: "center", margin: "0 0 4px" }}>
          Tarjeta {i + 1} · {cola.length === 1 ? "queda 1" : `quedan ${cola.length}`}
        </p>
        {tarjeta && tarjeta.titulo && (
          <p style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: 26, lineHeight: 1.1, color: "#5b4a3a", textAlign: "center", margin: "0 0 10px" }}>
            {tarjeta.titulo}
          </p>
        )}


        {tarjeta && (
          <div style={{ ...tarjetaBase, padding: 8, overflow: "hidden" }}>
            <img
              src={tarjeta.imagen}
              alt={`Tarjeta ${i + 1}`}
              style={{
                width: "100%",
                display: "block",
                borderRadius: 14,
                filter: fase === "tapada" ? "blur(9px)" : "none",
                transform: fase === "tapada" ? "scale(1.04)" : "none",
                transition: "filter 0.5s ease, transform 0.5s ease"
              }}
            />
          </div>
        )}

{fase === "mirar" ? (
          <>
            <p style={{ ...styles.configSubLabel, textAlign: "center", margin: "14px 0 10px" }}>
              Mírala con calma. Cuando la tengas, tápala y recítala sin mirar.
            </p>
            <button onClick={() => setFase("tapada")} style={styles.ctaButton}>
              Tapar y recitar
            </button>
          </>
        ) : fase === "tapada" ? (
          <>
            <p style={{ ...styles.configSubLabel, textAlign: "center", margin: "14px 0 10px" }}>
              Recita en voz alta lo que recuerdes de esta tarjeta. Después, destápala.
            </p>
            <button onClick={() => setFase("destapada")} style={styles.ctaButton}>
              Destapar
            </button>
            <button onClick={() => setFase("mirar")} style={styles.linkVolver}>
              Verla otra vez antes
            </button>
          </>
        ) : (
          <>
            <p style={{ ...styles.configSubLabel, textAlign: "center", margin: "14px 0 10px" }}>¿Cómo ha ido?</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => marcar("sellada")} style={{ ...botonNota, background: "#e3ecd9" }}>Sellada</button>
              <button onClick={() => marcar("casi")} style={{ ...botonNota, background: "#f7e9d2" }}>Casi</button>
              <button onClick={() => marcar("no")} style={{ ...botonNota, background: "#f9e3e3" }}>No</button>
            </div>
            <p style={{ ...styles.configSubLabel, textAlign: "center", marginTop: 8 }}>
              «Casi» y «No» vuelven al final, hasta que las selles todas.
            </p>
          </>
        )}
      </div>
    );
  }

  // 👀 VISOR DE TARJETAS
  const actual = tarjetas && tarjetas[indice];
  return (
    <div style={styles.menuContainer}>
      <button onClick={() => setVista("carpeta")} style={styles.linkVolver}><span className="hoja-volver"></span> {carpeta.nombre}</button>

      {actual && (
        <div
          onTouchStart={alTocar}
          onTouchEnd={alSoltar}
          style={{ ...tarjetaBase, padding: 8, overflow: ampliada ? "auto" : "hidden", maxHeight: ampliada ? "75vh" : "none" }}
        >
          <img
            src={actual.imagen}
            alt={`Tarjeta ${indice + 1} de ${tarjetas.length}`}
            onClick={() => setAmpliada((v) => !v)}
            style={{
              width: ampliada ? "200%" : "100%",
              maxWidth: "none",
              display: "block",
              borderRadius: 14,
              cursor: ampliada ? "zoom-out" : "zoom-in"
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 6px" }}>
        <button
          onClick={() => { setAmpliada(false); setIndice((i) => Math.max(0, i - 1)); }}
          disabled={indice === 0}
          aria-label="Tarjeta anterior"
          style={{ ...botonPequeno, width: 48, height: 48, fontSize: 20, padding: 0, opacity: indice === 0 ? 0.4 : 1 }}
        >
          ‹
        </button>
        <span style={{ fontWeight: 700, color: "#4a4038" }}>
          {indice + 1} de {tarjetas ? tarjetas.length : 0}
        </span>
        <button
          onClick={() => { setAmpliada(false); setIndice((i) => Math.min(tarjetas.length - 1, i + 1)); }}
          disabled={!tarjetas || indice >= tarjetas.length - 1}
          aria-label="Tarjeta siguiente"
          style={{ ...botonPequeno, width: 48, height: 48, fontSize: 20, padding: 0, opacity: !tarjetas || indice >= tarjetas.length - 1 ? 0.4 : 1 }}
        >
          ›
        </button>
      </div>
      <p style={{ ...styles.configSubLabel, textAlign: "center" }}>
        {ampliada ? "Toca la tarjeta para volver a su tamaño." : "Desliza para pasar · toca la tarjeta para ampliarla."}
      </p>
    </div>
  );
}