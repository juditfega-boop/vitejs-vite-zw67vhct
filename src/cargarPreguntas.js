// Reemplaza el contenido de tu cargarPreguntas.js por esto:
export async function cargarPreguntas() {
  // Tu URL de Google Sheets en formato CSV (reemplaza con la tuya si es diferente)
  const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAtrLr3XWfiqWGAdwsy4m6LNAxXeeLRuT7uNz4lGTxvGM-sNDR7axnl3TI5TvxRkO6mhPvskaKwBDi/pub?output=csv"; 

  try {
    const respuesta = await fetch(URL);
    const textoCSV = await respuesta.text();

    // Dividimos por líneas y limpiamos espacios o líneas vacías
    const lineas = textoCSV.split(/\r?\n/).filter(linea => linea.trim() !== "");
    if (lineas.length <= 1) return [];

    // Detectamos las cabeceras reales (pregunta, respuestas, bloque, correcta, explicacion)
    const cabeceras = lineas[0].split(",").map(c => c.replace(/"/g, "").trim().toLowerCase());

    const preguntasProcesadas = lineas.slice(1).map(linea => {
      // Expresión regular avanzada para separar por comas de forma segura sin romper los textos que llevan comas dentro
      const celdas = linea.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || linea.split(",");
      
      const fila = {};
      cabeceras.forEach((cabecera, i) => {
        let valor = celdas[i] ? celdas[i].trim() : "";
        // Quitamos las comillas extras que añade Google Sheets a los textos largos
        if (valor.startsWith('"') && valor.endsWith('"')) {
          valor = valor.substring(1, valor.length - 1);
        }
        fila[cabecera] = valor;
      });

      // Validamos que la fila tenga contenido real
      if (!fila.pregunta || fila.pregunta.trim() === "") return null;

      // Estructuramos las respuestas mapeando tus columnas específicas de respuestas
      // Cambia "respuesta1", "respuesta2"... por los nombres exactos de tus columnas si varían
      const respuestasLista = [
        fila.respuesta1 || fila.opciona,
        fila.respuesta2 || fila.opcionb,
        fila.respuesta3 || fila.opcionc,
        fila.respuesta4 || fila.opciond
      ].filter(Boolean);

      return {
        pregunta: fila.pregunta,
        bloque: fila.bloque || fila.bloques || "Sin bloque",
        explicacion: fila.explicacion || fila.explicación || "",
        respuestas: respuestasLista,
        correcta: parseInt(fila.correcta) || 0
      };
    }).filter(Boolean); // <--- Aquí eliminamos fulminantemente las filas vacías

    return preguntasProcesadas;

  } catch (error) {
    console.error("Error cargando el Sheets:", error);
    return [];
  }
}