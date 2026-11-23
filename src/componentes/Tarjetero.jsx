import { useEffect, useRef, useState } from "react";
import { styles } from "../estilos";
import iconoTarjetero from "../assets/kit/icono-hub-erre-que-erre.png";
import {
  listarCarpetas,
  crearCarpeta,
  renombrarCarpeta,
  borrarCarpeta,
  listarTarjetas,
  anadirTarjeta,
  borrarTarjeta,
  intercambiarOrden
} from "../servicios/tarjetero";
import { comprimirImagen } from "../servicios/comprimirImagen";
import { leerCurva, entrarEnCurva, apuntarRepaso, claveDia } from "../servicios/curva";

// "2026-11-26" → "jueves 26 de noviembre"
function fechaBonita(clave) {
  if (!clave) return "";
  const [a, m, d] = clave.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
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
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  const toqueInicio = useRef(null);
  // 🌿 sellar: tarjetas pendientes, si la actual está destapada y la primera nota de cada una
  const [curva, setCurva] = useState(null); // { idCarpeta: { paso, proxima } }
  const [cola, setCola] = useState([]);
  const [destapada, setDestapada] = useState(false);
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
    setDestapada(false);
    setFinSellado(null);
    setVista("sellar");
  }

  // sellada → fuera · casi / no → vuelve al final de la tanda
  function marcar(nota) {
    const [i, ...resto] = cola;
    const primeras = notas[i] ? notas : { ...notas, [i]: nota };
    setNotas(primeras);
    setDestapada(false);
    const nuevaCola = nota === "sellada" ? resto : [...resto, i];
    if (nuevaCola.length > 0) setCola(nuevaCola);
    else terminarSellado(primeras);
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
        await anadirTarjeta(carpeta.id, imagen, orden);
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
    return (
      <div style={styles.menuContainer}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img src={iconoTarjetero} alt="" style={{ width: 110, display: "block", margin: "0 auto 6px" }} />
          <h1 style={{ ...styles.menuTitle, marginBottom: 4 }}>Mi tarjetero</h1>
          <p style={{ ...styles.configSubLabel, marginTop: 0 }}>Tus resúmenes, ordenados en carpetas.</p>
        </div>

        {carpetas === null && <p style={styles.configSubLabel}>Cargando…</p>}
        {carpetas && carpetas.length === 0 && (
          <p style={{ ...styles.configSubLabel, textAlign: "center" }}>Todavía no tienes carpetas. Crea la primera aquí abajo.</p>
        )}

        {carpetas &&
          carpetas.map((c) => (
            <button
              key={c.id}
              onClick={() => abrirCarpeta(c)}
              style={{
                ...tarjetaBase,
                width: "100%",
                boxSizing: "border-box",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                padding: "16px 18px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#4a4038"
              }}
            >
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{c.nombre}</span>
                <span style={{ display: "block", fontSize: 13, color: "#6e6256" }}>
                  {c.total || 0} {c.total === 1 ? "tarjeta" : "tarjetas"}
                  {curva && curva[c.id] && (curva[c.id].proxima <= claveDia() ? " · 🌿 toca repasarla hoy" : " · sellada")}
                </span>
              </span>
              <span style={{ color: "#8a7d6f", fontSize: 18 }}>→</span>
            </button>
          ))}

        <div style={{ ...styles.configCard }}>
          <p style={styles.configCardTitle}>Nueva carpeta</p>
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Ej: Ley 39/2015"
            style={styles.nombreInput}
          />
          <button
            onClick={nuevaCarpeta}
            disabled={ocupado || !nuevoNombre.trim()}
            style={{ ...styles.ctaButton, ...(ocupado || !nuevoNombre.trim() ? styles.ctaButtonDisabled : {}) }}
          >
            Crear carpeta
          </button>
        </div>

        {mensaje && <p style={{ ...styles.configSubLabel, textAlign: "center" }}>{mensaje}</p>}

        <button onClick={volver} style={styles.linkVolver}>⬅ Volver</button>
      </div>
    );
  }

  // 🗂️ DENTRO DE UNA CARPETA
  if (vista === "carpeta") {
    return (
      <div style={styles.menuContainer}>
        <button onClick={() => setVista("carpetas")} style={styles.linkVolver}>⬅ Mi tarjetero</button>

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
        <button onClick={() => setVista("carpeta")} style={styles.linkVolver}>⬅ {carpeta.nombre}</button>
        <p style={{ ...styles.configSubLabel, textAlign: "center", margin: "0 0 10px" }}>
          Tarjeta {i + 1} · {cola.length === 1 ? "queda 1" : `quedan ${cola.length}`}
        </p>

        {tarjeta && (
          <div style={{ ...tarjetaBase, padding: 8, overflow: "hidden" }}>
            <img
              src={tarjeta.imagen}
              alt={`Tarjeta ${i + 1}`}
              style={{
                width: "100%",
                display: "block",
                borderRadius: 14,
                filter: destapada ? "none" : "blur(9px)",
                transform: destapada ? "none" : "scale(1.04)",
                transition: "filter 0.5s ease, transform 0.5s ease"
              }}
            />
          </div>
        )}

        {!destapada ? (
          <>
            <p style={{ ...styles.configSubLabel, textAlign: "center", margin: "14px 0 10px" }}>
              Recita en voz alta lo que recuerdes de esta tarjeta. Después, destápala.
            </p>
            <button onClick={() => setDestapada(true)} style={styles.ctaButton}>
              Destapar
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
      <button onClick={() => setVista("carpeta")} style={styles.linkVolver}>⬅ {carpeta.nombre}</button>

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