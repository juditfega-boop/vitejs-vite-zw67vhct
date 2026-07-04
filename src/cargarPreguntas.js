// 🧩 Parser de CSV robusto: entiende comillas y comas correctamente,
// tanto si el texto lleva comillas como si no.
function parsearLineaCSV(linea) {
  const resultado = [];
  let actual = "";
  let dentroComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];

    if (char === '"') {
      if (dentroComillas && linea[i + 1] === '"') {
        // comilla escapada ("") dentro de un campo entrecomillado
        actual += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
    } else if (char === "," && !dentroComillas) {
      resultado.push(actual);
      actual = "";
    } else {
      actual += char;
    }
  }

  resultado.push(actual);
  return resultado.map((v) => v.trim());
}

export async function cargarPreguntas() {
  // Tu URL de Google Sheets en formato CSV
  const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAtrLr3XWfiqWGAdwsy4m6LNAxXeeLRuT7uNz4lGTxvGM-sNDR7axnl3TI5TvxRkO6mhPvskaKwBDi/pub?output=csv";

  try {
    const respuesta = await fetch(URL);
    const textoCSV = await respuesta.text();

    // Dividimos por líneas y limpiamos espacios o líneas vacías
    const lineas = textoCSV.split(/\r?\n/).filter((linea) => linea.trim() !== "");
    if (lineas.length <= 1) return [];

    // Cabeceras reales de tu Sheet:
    // id, bloque, tema, pregunta, r1, r2, r3, correcta, articulo, explicacion, grupo
    const cabeceras = parsearLineaCSV(lineas[0]).map((c) =>
      c.replace(/"/g, "").trim().toLowerCase()
    );

    const preguntasProcesadas = lineas
      .slice(1)
      .map((linea) => {
        const celdas = parsearLineaCSV(linea);

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

        // Tus 3 columnas de respuesta reales: r1, r2, r3
        const respuestasLista = [fila.r1, fila.r2, fila.r3].filter(Boolean);

        return {
          id: fila.id,
          bloque: fila.bloque || "Sin bloque",
          tema: fila.tema || "",
          articulo: fila.articulo || "",
          pregunta: fila.pregunta,
          respuestas: respuestasLista,
          correcta: parseInt(fila.correcta) || 0,
          explicacion: fila.explicacion || "",
          grupo: fila.grupo || ""
        };
      })
      .filter(Boolean); // <--- eliminamos las filas vacías

    return preguntasProcesadas;
  } catch (error) {
    console.error("Error cargando el Sheets:", error);
    return [];
  }
}