import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import { observarSesion } from "../servicios/auth";
import { styles } from "../estilos";

// 🗓️ Tipos de día (mismas letras que el plan de estudio en Excel)
export const TIPOS_DIA = {
  E: { nombre: "Estudio", descripcion: "Día de estudio de temario", fondo: "#dbe7d3", texto: "#4f6b4a" },
  R: { nombre: "Repaso", descripcion: "Repaso corto, tests o tarjetas", fondo: "#e6dcf3", texto: "#6b5a8c" },
  M: { nombre: "Repaso mensual", descripcion: "Repaso de todo lo del mes", fondo: "#f6dade", texto: "#8c5560" },
  F: { nombre: "Repaso final", descripcion: "Repaso antes del examen", fondo: "#b7cfae", texto: "#3f5a3a" },
  V: { nombre: "Vacaciones", descripcion: "Vacaciones o festivo", fondo: "#dde5ec", texto: "#56677a" },
  L: { nombre: "Libre", descripcion: "Día de descanso", fondo: "#fbf8f2", texto: "#8a8578" }
};
const ORDEN_TIPOS = ["E", "R", "M", "F", "V", "L"];

const HOY_TE_TOCA = {
  E: { texto: "estudio", frase: "Un tema más hacia la plaza." },
  R: { texto: "repaso", frase: "Tests o tarjetas, sin agobios." },
  M: { texto: "repaso mensual", frase: "Hoy toca mirar todo lo del mes." },
  F: { texto: "repaso final", frase: "Ya queda muy poco. Confía en lo que sabes." },
  V: { texto: "vacaciones", frase: "Disfrutar también es parte del plan." },
  L: { texto: "día libre", frase: "Hoy toca descansar y coger fuerzas." }
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function claveFecha(anio, mes, dia) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export default function MiCalendario({ volverMenu, irAPerfil }) {
  const hoy = new Date();
  const claveHoy = claveFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const [usuario, setUsuario] = useState(undefined); // undefined = cargando
  const [dias, setDias] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    const dejarDeEscuchar = observarSesion((u) => setUsuario(u));
    return dejarDeEscuchar;
  }, []);

  useEffect(() => {
    if (!usuario) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError("");
    getDoc(doc(db, "calendarios", usuario.uid))
      .then((snap) => setDias(snap.exists() ? snap.data().dias || {} : {}))
      .catch(() => setError("No se ha podido cargar tu calendario. Revisa tu conexión."))
      .finally(() => setCargando(false));
  }, [usuario]);

  async function marcarDia(clave, letra) {
    const anterior = dias[clave];
    setDias((prev) => {
      const copia = { ...prev };
      if (letra) copia[clave] = letra;
      else delete copia[clave];
      return copia;
    });
    setDiaSeleccionado(null);
    setError("");

    try {
      await setDoc(
        doc(db, "calendarios", usuario.uid),
        { dias: { [clave]: letra ? letra : deleteField() }, actualizado: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      setDias((prev) => {
        const copia = { ...prev };
        if (anterior) copia[clave] = anterior;
        else delete copia[clave];
        return copia;
      });
      setError("No se ha podido guardar el cambio. Inténtalo de nuevo.");
    }
  }

  function mesAnterior() {
    setDiaSeleccionado(null);
    if (mes === 0) {
      setMes(11);
      setAnio((a) => a - 1);
    } else setMes((m) => m - 1);
  }

  function mesSiguiente() {
    setDiaSeleccionado(null);
    if (mes === 11) {
      setMes(0);
      setAnio((a) => a + 1);
    } else setMes((m) => m + 1);
  }

  const cabecera = (
    <div style={styles.menuHeader}>
      <h1 style={styles.menuTitle}>Mi calendario</h1>
      <div style={styles.menuUnderline} />
    </div>
  );

  if (usuario === undefined) return null;

  // 🔒 sin sesión iniciada
  if (!usuario) {
    return (
      <div style={styles.menuContainer}>
        {cabecera}
        <div style={{ ...styles.configCard, textAlign: "center" }}>
          <p style={styles.configCardTitle}>Tu calendario se guarda en tu cuenta</p>
          <p style={styles.configSubLabel}>
            Inicia sesión en Mi perfil para planificar tus días de estudio y verlos desde
            cualquier dispositivo.
          </p>
          <button onClick={irAPerfil} style={{ ...styles.ctaButton, marginTop: 14 }}>
            Ir a Mi perfil
          </button>
        </div>
        <button onClick={volverMenu} style={styles.linkVolver}>
          ⬅ Volver al menú
        </button>
      </div>
    );
  }

  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const celdas = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1)
  ];

  const letraHoy = dias[claveHoy];
  const tipoHoy = letraHoy ? TIPOS_DIA[letraHoy] : null;

  function planificarHoy() {
    setMes(hoy.getMonth());
    setAnio(hoy.getFullYear());
    setDiaSeleccionado(claveHoy);
  }

  const contadorMes = {};
  for (let d = 1; d <= diasDelMes; d++) {
    const letra = dias[claveFecha(anio, mes, d)];
    if (letra) contadorMes[letra] = (contadorMes[letra] || 0) + 1;
  }

  const flechaBtn = {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "1px solid #eadfcd",
    background: "#fffaf2",
    color: "#5b4a3a",
    fontSize: 18,
    cursor: "pointer",
    fontFamily: "inherit"
  };

  return (
    <div style={styles.menuContainer}>
      {cabecera}

{!cargando && (
  <div
    style={{
      ...styles.configCard,
      background: tipoHoy ? tipoHoy.fondo : "#fffaf2",
      textAlign: "center"
    }}
  >
    {tipoHoy ? (
      <>
        <p style={{ ...styles.configSubLabel, margin: 0 }}>Hoy te toca</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: tipoHoy.texto, margin: "4px 0" }}>
          {HOY_TE_TOCA[letraHoy].texto.charAt(0).toUpperCase() + HOY_TE_TOCA[letraHoy].texto.slice(1)}
        </p>
        <p style={{ ...styles.configSubLabel, margin: 0 }}>{HOY_TE_TOCA[letraHoy].frase}</p>
      </>
    ) : (
      <>
        <p style={{ ...styles.configSubLabel, margin: 0 }}>Hoy todavía no tienes nada marcado.</p>
        <button onClick={planificarHoy} style={{ ...styles.linkVolver, marginTop: 6 }}>
          Planificar hoy
        </button>
      </>
    )}
  </div>
)}

<div style={styles.configCard}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={mesAnterior} style={flechaBtn} aria-label="Mes anterior">‹</button>
          <p style={{ ...styles.configCardTitle, margin: 0 }}>
            {MESES[mes]} {anio}
          </p>
          <button onClick={mesSiguiente} style={flechaBtn} aria-label="Mes siguiente">›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {DIAS_SEMANA.map((d, i) => (
            <div key={`cab-${i}`} style={{ textAlign: "center", fontSize: 12, color: "#8a8578", fontWeight: 700 }}>
              {d}
            </div>
          ))}

          {celdas.map((dia, i) => {
            if (dia === null) return <div key={`vacio-${i}`} />;
            const clave = claveFecha(anio, mes, dia);
            const letra = dias[clave];
            const tipo = letra ? TIPOS_DIA[letra] : null;
            const esHoy = clave === claveHoy;
            const seleccionado = clave === diaSeleccionado;

            return (
              <button
                key={clave}
                onClick={() => setDiaSeleccionado(seleccionado ? null : clave)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 12,
                  border: seleccionado ? "2px solid #b9a8de" : "1px solid #efe7da",
                  boxShadow: esHoy ? "0 0 0 2px #e2a3a9" : "none",
                  background: tipo ? tipo.fondo : "#fffdf9",
                  color: tipo ? tipo.texto : "#4a463f",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1.1
                }}
              >
                <span style={{ fontSize: 12 }}>{dia}</span>
                {letra && <span style={{ fontSize: 14, fontWeight: 700 }}>{letra}</span>}
              </button>
            );
          })}
        </div>

        {cargando && <p style={{ ...styles.configSubLabel, marginTop: 10 }}>Cargando tu calendario...</p>}
        {error && <p style={{ ...styles.configSubLabel, color: "#c96a6a", marginTop: 10 }}>{error}</p>}
      </div>

      {diaSeleccionado && (
        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>
            {Number(diaSeleccionado.slice(8))} de {MESES[Number(diaSeleccionado.slice(5, 7)) - 1].toLowerCase()}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ORDEN_TIPOS.map((letra) => {
              const tipo = TIPOS_DIA[letra];
              const activo = dias[diaSeleccionado] === letra;
              return (
                <button
                  key={letra}
                  onClick={() => marcarDia(diaSeleccionado, letra)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: activo ? `2px solid ${tipo.texto}` : "1px solid #efe7da",
                    background: tipo.fondo,
                    color: tipo.texto,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                    textAlign: "left"
                  }}
                >
                  <b style={{ fontSize: 16 }}>{letra}</b> {tipo.nombre}
                </button>
              );
            })}
          </div>
          {dias[diaSeleccionado] && (
            <button onClick={() => marcarDia(diaSeleccionado, null)} style={styles.linkVolver}>
              Quitar la marca de este día
            </button>
          )}
        </div>
      )}

      {Object.keys(contadorMes).length > 0 && (
        <div style={styles.configCard}>
          <p style={styles.configCardTitle}>Este mes</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ORDEN_TIPOS.filter((l) => contadorMes[l]).map((l) => (
              <span
                key={l}
                style={{
                  background: TIPOS_DIA[l].fondo,
                  color: TIPOS_DIA[l].texto,
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 13
                }}
              >
                {contadorMes[l]} {TIPOS_DIA[l].nombre.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={styles.configCard}>
        <p style={styles.configCardTitle}>Leyenda</p>
        {ORDEN_TIPOS.map((letra) => {
          const tipo = TIPOS_DIA[letra];
          return (
            <div key={letra} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: tipo.fondo,
                  color: tipo.texto,
                  border: "1px solid #efe7da",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {letra}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#4a463f", fontSize: 14 }}>{tipo.nombre}</p>
                <p style={{ ...styles.configSubLabel, margin: 0 }}>{tipo.descripcion}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={volverMenu} style={styles.linkVolver}>
        ⬅ Volver al menú
      </button>
    </div>
  );
}