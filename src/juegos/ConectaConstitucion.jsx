import { useState, useEffect } from "react";
import { ARTICULOS_CONSTITUCION } from "../datosArticulosConstitucion";
import { FECHAS_CONSTITUCION } from "../datosFechasConstitucion";
import { styles, globalStyles } from "../estilos";

// 🔀 mezcla un array al azar (copia local, igual que en App.jsx)
function mezclar(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

const EXPEDIENTES_CONECTA = [
  { id: "articulos", nombre: "Artículos y contenido", emoji: "🛡️", datos: ARTICULOS_CONSTITUCION },
  { id: "fechas", nombre: "Fechas importantes", emoji: "🗓️", datos: FECHAS_CONSTITUCION }
];

// 📁 "Conecta la Constitución" — componente independiente y autocontenido.
export default function ConectaConstitucion({ setPantalla, volverMenu }) {
  const [vista, setVista] = useState("detalle"); // "detalle" | "expedientes" | "jugando" | "resultado"

  const [archivosDatosActivos, setArchivosDatosActivos] = useState([]);
  const [archivosPareja, setArchivosPareja] = useState([]);
  const [archivosArticulos, setArchivosArticulos] = useState([]);
  const [archivosDescripciones, setArchivosDescripciones] = useState([]);
  const [archivosSelArticulo, setArchivosSelArticulo] = useState(null);
  const [archivosSelDescripcion, setArchivosSelDescripcion] = useState(null);
  const [archivosVerde, setArchivosVerde] = useState([]);
  const [archivosDesvaneciendo, setArchivosDesvaneciendo] = useState([]);
  const [archivosResueltos, setArchivosResueltos] = useState([]);
  const [archivosError, setArchivosError] = useState(null);
  const [archivosMostrarResumen, setArchivosMostrarResumen] = useState(false);

  function comenzarJuegoArchivos(datosExpediente) {
    const numParejas = Math.min(8, datosExpediente.length);
    const seleccionadas = mezclar(datosExpediente).slice(0, numParejas);

    setArchivosDatosActivos(datosExpediente);
    setArchivosPareja(seleccionadas);
    setArchivosArticulos(
      mezclar(seleccionadas.map((a) => ({
        id: a.id,
        texto: a.etiqueta || `Artículo ${a.articulo}`
      })))
    );
    setArchivosDescripciones(
      mezclar(seleccionadas.map((a) => ({ id: a.id, texto: a.descripcion })))
    );
    setArchivosSelArticulo(null);
    setArchivosSelDescripcion(null);
    setArchivosVerde([]);
    setArchivosDesvaneciendo([]);
    setArchivosResueltos([]);
    setArchivosError(null);
    setArchivosMostrarResumen(false);
    setVista("jugando");
  }

  function comprobarParejaArchivos(idArticulo, idDescripcion) {
    if (idArticulo === idDescripcion) {
      setArchivosVerde((v) => [...v, idArticulo]);

      setTimeout(() => {
        setArchivosDesvaneciendo((d) => [...d, idArticulo]);
      }, 500);

      setTimeout(() => {
        setArchivosResueltos((r) => [...r, idArticulo]);
        setArchivosVerde((v) => v.filter((x) => x !== idArticulo));
        setArchivosDesvaneciendo((d) => d.filter((x) => x !== idArticulo));
        setArchivosSelArticulo(null);
        setArchivosSelDescripcion(null);
      }, 800);
    } else {
      setArchivosError({ articulo: idArticulo, descripcion: idDescripcion });

      setTimeout(() => {
        setArchivosError(null);
        setArchivosSelArticulo(null);
        setArchivosSelDescripcion(null);
      }, 450);
    }
  }

  function seleccionarArticuloArchivos(id) {
    if (archivosResueltos.includes(id) || archivosError) return;
    setArchivosSelArticulo(id);
    if (archivosSelDescripcion !== null) {
      comprobarParejaArchivos(id, archivosSelDescripcion);
    }
  }

  function seleccionarDescripcionArchivos(id) {
    if (archivosResueltos.includes(id) || archivosError) return;
    setArchivosSelDescripcion(id);
    if (archivosSelArticulo !== null) {
      comprobarParejaArchivos(archivosSelArticulo, id);
    }
  }

  function agruparArchivosPorCapitulo(lista) {
    const grupos = {};

    lista.forEach((item) => {
      const clave = item.capituloNumero;
      if (!grupos[clave]) {
        grupos[clave] = {
          numero: item.capituloNumero,
          nombre: item.capituloNombre,
          articulos: []
        };
      }
      grupos[clave].articulos.push(item);
    });

    return Object.values(grupos)
      .sort((a, b) => a.numero.localeCompare(b.numero))
      .map((g) => ({
        ...g,
        articulos: [...g.articulos].sort(
          (a, b) => (a.orden ?? a.articulo ?? 0) - (b.orden ?? b.articulo ?? 0)
        )
      }));
  }

  // 📁 cuando las parejas están resueltas, pasa a la pantalla de resultado
  useEffect(() => {
    if (
      vista === "jugando" &&
      archivosPareja.length > 0 &&
      archivosResueltos.length === archivosPareja.length
    ) {
      const id = setTimeout(() => setVista("resultado"), 400);
      return () => clearTimeout(id);
    }
  }, [vista, archivosResueltos, archivosPareja]);

  // 📁 DETALLE
  if (vista === "detalle") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📁 Conecta la Constitución</h1>
          <div style={styles.menuUnderline} />
        </div>

        <p style={styles.configSubLabel}>
          Alguien ha mezclado los archivos de la Constitución. Tu misión es
          volver a organizarlos: relaciona cada artículo con su contenido.
          Cada partida elige 8 parejas al azar.
        </p>

        <button onClick={() => setVista("expedientes")} style={styles.ctaButton}>
          Jugar
        </button>

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 📁 ELEGIR EXPEDIENTE
  if (vista === "expedientes") {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📁 Elige un expediente</h1>
          <div style={styles.menuUnderline} />
        </div>

        {EXPEDIENTES_CONECTA.map((exp) => (
          <button
            key={exp.id}
            onClick={() => comenzarJuegoArchivos(exp.datos)}
            style={styles.filaMinijuegoBtn}
          >
            <span style={styles.miniaturaMinijuegoEmoji}>{exp.emoji}</span>
            <span style={styles.filaMinijuegoTexto}>{exp.nombre}</span>
            <span style={{ color: "#8a8578" }}>→</span>
          </button>
        ))}

        <button onClick={() => setVista("detalle")} style={styles.linkVolver}>
          ⬅ Volver
        </button>
      </div>
    );
  }

  // 📁 EN CURSO
  if (vista === "jugando") {
    return (
      <div style={styles.menuContainer}>
        <style>{globalStyles}</style>

        <div style={styles.simHeaderBar}>
          <span style={styles.simTimer}>
            📁 Archivados: {archivosResueltos.length} / {archivosPareja.length}
          </span>
        </div>

        <div style={styles.archivosColumnas}>
          <div style={styles.archivosColumna}>
            {archivosArticulos.map((item) => {
              if (archivosResueltos.includes(item.id)) return null;

              const seleccionado = archivosSelArticulo === item.id;
              const enVerde = archivosVerde.includes(item.id);
              const enError =
                archivosError && archivosError.articulo === item.id;
              const desvaneciendo = archivosDesvaneciendo.includes(item.id);

              return (
                <button
                  key={item.id}
                  className={enError ? "archivos-shake" : ""}
                  onClick={() => seleccionarArticuloArchivos(item.id)}
                  style={{
                    ...styles.archivosTarjeta,
                    ...(seleccionado ? styles.archivosTarjetaSeleccionada : {}),
                    ...(enVerde ? styles.archivosTarjetaCorrecta : {}),
                    ...(enError ? styles.archivosTarjetaError : {}),
                    ...(desvaneciendo ? { opacity: 0, transform: "scale(0.9)" } : {})
                  }}
                >
                  {item.texto}
                </button>
              );
            })}
          </div>

          <div style={styles.archivosColumna}>
            {archivosDescripciones.map((item) => {
              if (archivosResueltos.includes(item.id)) return null;

              const seleccionado = archivosSelDescripcion === item.id;
              const enVerde = archivosVerde.includes(item.id);
              const enError =
                archivosError && archivosError.descripcion === item.id;
              const desvaneciendo = archivosDesvaneciendo.includes(item.id);

              return (
                <button
                  key={item.id}
                  className={enError ? "archivos-shake" : ""}
                  onClick={() => seleccionarDescripcionArchivos(item.id)}
                  style={{
                    ...styles.archivosTarjeta,
                    ...styles.archivosTarjetaDescripcion,
                    ...(seleccionado ? styles.archivosTarjetaSeleccionada : {}),
                    ...(enVerde ? styles.archivosTarjetaCorrecta : {}),
                    ...(enError ? styles.archivosTarjetaError : {}),
                    ...(desvaneciendo ? { opacity: 0, transform: "scale(0.9)" } : {})
                  }}
                >
                  {item.texto}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 📁 RESULTADO
  if (vista === "resultado") {
    const grupos = agruparArchivosPorCapitulo(archivosPareja);

    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuHeader}>
          <h1 style={styles.menuTitle}>📁 Archivos organizados correctamente</h1>
          <div style={styles.menuUnderline} />
        </div>

        <button onClick={() => comenzarJuegoArchivos(archivosDatosActivos)} style={styles.ctaButton}>
          Jugar otra vez
        </button>

        <button
          onClick={() => setArchivosMostrarResumen((v) => !v)}
          style={styles.linkVolver}
        >
          {archivosMostrarResumen ? "▲ Ocultar resumen" : "▼ Ver resumen"}
        </button>

        {archivosMostrarResumen && (
          <div style={{ marginTop: 10 }}>
            {grupos.map((g) => (
              <div key={g.numero} style={styles.configCard}>
                <p style={styles.configCardTitle}>
                  Capítulo {g.numero} — {g.nombre}
                </p>
                {g.articulos.map((a) => (
                  <p key={a.id} style={{ ...styles.configSubLabel, marginBottom: 6 }}>
                    <b>{a.etiqueta || `Artículo ${a.articulo}`}:</b> {a.descripcion}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setPantalla("minijuegos")} style={styles.linkVolver}>
          ⬅ Volver a minijuegos
        </button>

        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  return null;
}