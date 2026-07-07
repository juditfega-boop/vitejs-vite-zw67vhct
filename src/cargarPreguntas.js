// 🧩 Parser de CSV completo y robusto: entiende comillas, comas Y saltos de
// línea dentro de una misma celda (por ejemplo, una explicación larga con
// varios párrafos escrita dentro de una sola casilla del Sheet).
function parsearCSVCompleto(texto) {
  const filas = [];
  let fila = [];
  let actual = "";
  let dentroComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const siguiente = texto[i + 1];

    if (char === '"') {
      if (dentroComillas && siguiente === '"') {
        // comilla escapada ("") dentro de un campo entrecomillado
        actual += '"';
        i++;
      } else {
        dentroComillas = !dentroComillas;
      }
    } else if (char === "," && !dentroComillas) {
      fila.push(actual);
      actual = "";
    } else if ((char === "\n" || char === "\r") && !dentroComillas) {
      // fin de fila real (solo si NO estamos dentro de una celda con comillas)
      if (char === "\r" && siguiente === "\n") i++; // evita doble salto \r\n
      fila.push(actual);
      filas.push(fila);
      fila = [];
      actual = "";
    } else {
      actual += char;
    }
  }

  // por si el archivo no termina con un salto de línea
  if (actual.length > 0 || fila.length > 0) {
    fila.push(actual);
    filas.push(fila);
  }

  return filas
    .map((f) => f.map((v) => v.trim()))
    .filter((f) => !(f.length === 1 && f[0] === ""));
}

export async function cargarPreguntas() {
  // Tu URL de Google Sheets en formato CSV
  const URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAtrLr3XWfiqWGAdwsy4m6LNAxXeeLRuT7uNz4lGTxvGM-sNDR7axnl3TI5TvxRkO6mhPvskaKwBDi/pub?output=csv";

  try {
    const respuesta = await fetch(URL);
    const textoCSV = await respuesta.text();

    const filas = parsearCSVCompleto(textoCSV);
    if (filas.length <= 1) return [];

    // Cabeceras reales de tu Sheet:
    // id, bloque, tema, pregunta, r1, r2, r3, correcta, articulo, explicacion, grupo
    const cabeceras = filas[0].map((c) =>
      c.replace(/"/g, "").trim().toLowerCase()
    );

    const preguntasProcesadas = filas
      .slice(1)
      .map((celdas) => {
        const fila = {};
        cabeceras.forEach((cabecera, i) => {
          let valor = celdas[i] !== undefined ? celdas[i].trim() : "";
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
      .filter(Boolean);

    return preguntasProcesadas;
  } catch (error) {
    console.error("Error cargando el Sheets:", error);
    return [];
  }
}