// 📖 Renderizador compartido para las explicaciones de las preguntas.
// Entiende:
//   **negrita**
//   ### Título          -> línea de título
//   * Texto / - Texto   -> viñeta
//     * Texto           -> viñeta con sangría (2+ espacios antes del *)
// Se usa igual en Estudiar, Salva a la TS y Simulacro.

function parseInlineBold(str, keyPrefix) {
    const partes = str.split(/(\*\*.+?\*\*)/g);
    return partes.map((parte, j) =>
      parte.startsWith("**") && parte.endsWith("**") && parte.length >= 4 ? (
        <b key={`${keyPrefix}-b-${j}`}>{parte.slice(2, -2)}</b>
      ) : (
        <span key={`${keyPrefix}-t-${j}`}>{parte}</span>
      )
    );
  }
  
  export function renderizarTextoConNegrita(texto) {
    if (!texto) return null;
  
    const lineas = texto.replace(/\r\n/g, "\n").split("\n");
    const bloques = [];
    let listaActual = null;
  
    function cerrarLista() {
      if (listaActual) {
        bloques.push(listaActual);
        listaActual = null;
      }
    }
  
    lineas.forEach((lineaOriginal, i) => {
      const linea = lineaOriginal.trimEnd();
  
      if (linea.trim() === "") {
        cerrarLista();
        return;
      }
  
      const matchTitulo = linea.match(/^#{1,4}\s+(.*)$/);
      if (matchTitulo) {
        cerrarLista();
        bloques.push(
          <p key={`h-${i}`} style={{ margin: bloques.length === 0 ? 0 : "14px 0 6px", fontWeight: 700, fontSize: 14 }}>
            {parseInlineBold(matchTitulo[1], `h-${i}`)}
          </p>
        );
        return;
      }
  
      const matchViñeta = linea.match(/^(\s*)[*-]\s+(.*)$/);
      if (matchViñeta) {
        const nivel = matchViñeta[1].length >= 2 ? 1 : 0;
        if (!listaActual) listaActual = { esLista: true, items: [] };
        listaActual.items.push({ nivel, contenido: matchViñeta[2], key: `li-${i}` });
        return;
      }
  
      cerrarLista();
      bloques.push(
        <p key={`p-${i}`} style={{ margin: bloques.length === 0 ? 0 : "8px 0 0", lineHeight: 1.6 }}>
          {parseInlineBold(linea, `p-${i}`)}
        </p>
      );
    });
    cerrarLista();
  
    return bloques.map((b, idx) => {
      if (b && b.esLista) {
        return (
          <ul key={`ul-${idx}`} style={{ margin: "6px 0", paddingLeft: 18 }}>
            {b.items.map((it) => (
              <li key={it.key} style={{ marginLeft: it.nivel * 16, marginBottom: 4, lineHeight: 1.5 }}>
                {parseInlineBold(it.contenido, it.key)}
              </li>
            ))}
          </ul>
        );
      }
      return b;
    });
  }