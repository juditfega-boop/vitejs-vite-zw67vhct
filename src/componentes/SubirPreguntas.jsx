import { useState } from "react";
import { cargarPreguntas } from "../cargarPreguntas";
import { subirBanco } from "../servicios/banco";
import { styles } from "../estilos";

export default function SubirPreguntas() {
  const [estado, setEstado] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  async function alElegirArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setSubiendo(true);
    setEstado("Leyendo el archivo…");
    try {
      const texto = await archivo.text();
      const preguntas = await cargarPreguntas(texto);
      if (preguntas.length === 0) {
        setEstado("⚠️ No he encontrado preguntas en ese archivo. ¿Es el CSV de la hoja de preguntas?");
        setSubiendo(false);
        return;
      }
      setEstado(`Subiendo ${preguntas.length} preguntas…`);
      const r = await subirBanco(preguntas);
      setEstado(`✅ Subidas ${r.total} preguntas (${r.demo} de demo).`);
    } catch (err) {
      console.error(err);
      setEstado("⚠️ No se pudieron subir. Revisa las reglas de Firestore o pásame la consola.");
    }
    setSubiendo(false);
  }

  return (
    <div style={styles.configCard}>
      <p style={styles.configCardTitle}>Actualizar preguntas</p>
      <p style={styles.configSubLabel}>
        En tu Google Sheets, con la pestaña de preguntas abierta: Archivo → Descargar →
        Valores separados por comas (.csv). Después elige aquí ese archivo.
      </p>
      <label
        style={{
          ...styles.ctaButton,
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
          cursor: subiendo ? "default" : "pointer",
          ...(subiendo ? styles.ctaButtonDisabled : {})
        }}
      >
        {subiendo ? "Subiendo…" : "Elegir archivo CSV"}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={alElegirArchivo}
          disabled={subiendo}
          style={{ display: "none" }}
        />
      </label>
      {estado && <p style={{ ...styles.configSubLabel, marginTop: 10 }}>{estado}</p>}
    </div>
  );
}