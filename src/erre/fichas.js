// 🗂️ "Erre que erre": convierte el texto de un artículo (con las palabras
// clave marcadas entre **) en fichas con huecos. Sirve para cualquier ley
// que tenga el mismo formato que el JSON de la Constitución.

// separa el contenido en apartados ("1. …", "2. …"); si no está numerado, es uno solo
export function separarApartados(contenido) {
    const texto = (contenido || "").trim();
    const patron = /(^|\s)(\d{1,2})\.\s(?=[A-ZÁÉÍÓÚÑ«¿*])/g;
    const cortes = [];
    let esperado = 1;
    let m;
    while ((m = patron.exec(texto)) !== null) {
      if (Number(m[2]) === esperado) {
        cortes.push({ numero: esperado, inicio: m.index + m[1].length, inicioTexto: patron.lastIndex });
        esperado += 1;
      }
    }
    if (cortes.length === 0 || cortes[0].inicio !== 0) return [{ numero: null, texto }];
    return cortes.map((c, i) => ({
      numero: c.numero,
      texto: texto.slice(c.inicioTexto, i + 1 < cortes.length ? cortes[i + 1].inicio : texto.length).trim()
    }));
  }
  
  // trocea un texto en partes normales y palabras clave (**así**)
  export function trocear(texto) {
    return (texto || "")
      .split(/(\*\*.+?\*\*)/g)
      .filter(Boolean)
      .map((parte) =>
        parte.startsWith("**") && parte.endsWith("**")
          ? { clave: true, valor: parte.slice(2, -2) }
          : { clave: false, valor: parte }
      );
  }
  
  // ¿este artículo tiene palabras clave marcadas?
  export function tieneClaves(contenido) {
    return /\*\*.+?\*\*/.test(contenido || "");
  }
  
  // para comparar respuestas sin tener en cuenta tildes, mayúsculas ni signos
  export function normalizar(texto) {
    return (texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[«»"'.,;:()¿?¡!]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  // segundos para memorizar: 20 por apartado, con un mínimo de 30 y un máximo de 120
  export function segundosMemorizar(numeroApartados) {
    return Math.min(120, Math.max(30, numeroApartados * 20));
  }
  // ✂️ palabras pequeñas que ya vienen puestas en los huecos (no hace falta escribirlas)
const PALABRAS_PEQUENAS = new Set([
  "y", "e", "o", "u", "ni", "de", "del", "la", "las", "el", "los", "lo", "a", "al",
  "en", "por", "para", "con", "sin", "su", "sus", "un", "una", "que", "se"
]);

// parte una palabra clave en trozos: las palabras que hay que escribir y lo que ya viene puesto
// "Estado social y democrático de Derecho" → Estado · social · (y) · democrático · (de) · Derecho
export function trocearClave(valor) {
  const trozos = (valor || "")
    .split(/(\s+|[,;:.()«»"])/)
    .filter(Boolean)
    .map((t) => {
      const limpio = normalizar(t);
      return { escribir: !!limpio && !PALABRAS_PEQUENAS.has(limpio), valor: t };
    });
  // si la clave es solo una palabra pequeña ("villa" no, pero p. ej. "de"), se escribe entera
  if (!trozos.some((t) => t.escribir)) return trozos.map((t) => ({ ...t, escribir: !!normalizar(t.valor) }));
  return trozos;
}

// solo las palabras que hay que escribir de una palabra clave
export function palabrasClave(valor) {
  return trocearClave(valor)
    .filter((t) => t.escribir)
    .map((t) => t.valor);
}
