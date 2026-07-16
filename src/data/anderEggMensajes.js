// 🗝️ Mensajes de "Ezequiel, el Archivero" — minijuego "Construye la Constitución"
//
// Archivo independiente del componente del juego. Cada mensaje indica su
// categoría en "tipo":
//
//   "curiosidad" → dato curioso sobre la Constitución
//   "estudio"    → consejo general de técnica de estudio
//   "biografia"  → dato real y breve sobre Ezequiel Ander-Egg (no frases
//                  inventadas en su boca, solo datos objetivos de su trayectoria)
//
// 👉 Para añadir más mensajes tú misma, copia cualquier línea y cambia el texto.
// No hace falta tocar nada del componente del juego.
//
// Nota: las PISTAS concretas (con números de artículo) no viven en este
// archivo — se generan siempre a partir de los datos reales de
// construyeConstitucion.js, para que nunca puedan quedar desactualizadas
// si cambias esa estructura en el futuro.

export const MENSAJES_ANDER_EGG = [
    { tipo: "curiosidad", texto: "El Título I es uno de los más preguntados en las oposiciones." },
    { tipo: "curiosidad", texto: "Los principios rectores comienzan en el artículo 39." },
    { tipo: "curiosidad", texto: "Comprender la estructura ayuda mucho más que memorizar números sueltos." },
    { tipo: "curiosidad", texto: "El Título Preliminar recoge los principios fundamentales del Estado, del artículo 1 al 9." },
    { tipo: "curiosidad", texto: "Las garantías de los derechos fundamentales se recogen solo en dos artículos: el 53 y el 54." },
  
    { tipo: "estudio", texto: "Intenta recordar primero la estructura general y después los artículos concretos." },
    { tipo: "estudio", texto: "Cuando entiendes dónde está un artículo, después es mucho más fácil recordarlo." },
    { tipo: "estudio", texto: "Construir un mapa mental suele funcionar mejor que memorizar de forma aislada." },
    { tipo: "estudio", texto: "Repasar poco a poco, varios días seguidos, funciona mejor que un solo repaso largo." },
  
    { tipo: "biografia", texto: "Ezequiel Ander-Egg dedicó gran parte de su trabajo a la planificación social y al desarrollo comunitario." },
    { tipo: "biografia", texto: "Ha escrito numerosos libros sobre metodología y planificación." },
    { tipo: "biografia", texto: "Sus obras siguen siendo una referencia para muchos profesionales del Trabajo Social." }
  ];