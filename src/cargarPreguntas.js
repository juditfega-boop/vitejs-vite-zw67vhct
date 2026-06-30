function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);

  return lines.map(line => {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result.map(v => v.replaceAll('"', "").trim());
  });
}

export async function cargarPreguntas() {
  try {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAtrLr3XWfiqWGAdwsy4m6LNAxXeeLRuT7uNz4lGTxvGM-sNDR7axnl3TI5TvxRkO6mhPvskaKwBDi/pub?output=csv";

    const res = await fetch(url);
    const text = await res.text();

    const rows = parseCSV(text);
    const data = rows.slice(1);

    return data.map((row) => ({
      id: row[0],
      bloque: row[1],
      tema: row[2],
      pregunta: row[3],
      respuestas: [row[4], row[5], row[6]],
      correcta: Number(row[7]),
      articulo: row[8],
      explicacion: row[9]
    }));
  } catch (error) {
    console.error("❌ Error cargando CSV:", error);
    return [];
  }
}