// 🏛️ Datos del minijuego "Construye la Constitución"
//
// Archivo independiente del componente del juego. El juego no sabe nada
// de "la Constitución" en concreto — solo espera un array de objetos
// con esta forma exacta:
//
//   {
//     id: número único,
//     tipo: "Título" | "Capítulo" | "Sección"   (para la sangría visual)
//     nombre: "Título I", "Capítulo III", "Sección 1ª"...
//     titulo: nombre descriptivo de ese apartado,
//     inicio: número de artículo inicial,
//     fin: número de artículo final
//   }
//
// 👉 Para crear en el futuro "Construye la Ley de Dependencia" o
// cualquier otra ley, solo hay que crear OTRO archivo con esta misma
// forma y usarlo en vez de este — el juego en sí no se toca para nada.

export const ESTRUCTURA_CONSTITUCION = [
    { id: 1, tipo: "Título", nombre: "Título Preliminar", titulo: "Principios fundamentales del Estado", inicio: 1, fin: 9 },
    { id: 2, tipo: "Título", nombre: "Título I", titulo: "Derechos y deberes fundamentales", inicio: 10, fin: 55 },
    { id: 3, tipo: "Capítulo", nombre: "Título I - Capítulo I", titulo: "De los españoles y los extranjeros", inicio: 11, fin: 13 },
    { id: 4, tipo: "Capítulo", nombre: "Título I - Capítulo II", titulo: "Derechos y libertades", inicio: 14, fin: 38 },
    { id: 5, tipo: "Sección", nombre: "Título I - Cap. II - Sección 1ª", titulo: "De los derechos fundamentales y de las libertades públicas", inicio: 15, fin: 29 },
    { id: 6, tipo: "Sección", nombre: "Título I - Cap. II - Sección 2ª", titulo: "De los derechos y deberes de los ciudadanos", inicio: 30, fin: 38 },
    { id: 7, tipo: "Capítulo", nombre: "Capítulo III", titulo: "Principios rectores de la política social y económica", inicio: 39, fin: 52 },
    { id: 8, tipo: "Capítulo", nombre: "Capítulo IV", titulo: "Garantías de las libertades y derechos fundamentales", inicio: 53, fin: 54 },
    { id: 9, tipo: "Capítulo", nombre: "Capítulo V", titulo: "De la suspensión de los derechos y libertades", inicio: 55, fin: 55 },
    { id: 10, tipo: "Título", nombre: "Título II", titulo: "De la Corona", inicio: 56, fin: 65 },
    { id: 11, tipo: "Título", nombre: "Título III", titulo: "De las Cortes Generales", inicio: 66, fin: 96 },
    { id: 12, tipo: "Título", nombre: "Título IV", titulo: "Del Gobierno y de la Administración", inicio: 97, fin: 107 },
    { id: 13, tipo: "Título", nombre: "Título V", titulo: "De las relaciones entre el Gobierno y las Cortes Generales", inicio: 108, fin: 116 },
    { id: 14, tipo: "Título", nombre: "Título VI", titulo: "Del Poder Judicial", inicio: 117, fin: 127 },
    { id: 15, tipo: "Título", nombre: "Título VII", titulo: "Economía y Hacienda", inicio: 128, fin: 136 },
    { id: 16, tipo: "Título", nombre: "Título VIII", titulo: "De la Organización Territorial del Estado", inicio: 137, fin: 158 },
    { id: 17, tipo: "Título", nombre: "Título IX", titulo: "Del Tribunal Constitucional", inicio: 159, fin: 165 },
    { id: 18, tipo: "Título", nombre: "Título X", titulo: "De la reforma constitucional", inicio: 166, fin: 169 }
  ];