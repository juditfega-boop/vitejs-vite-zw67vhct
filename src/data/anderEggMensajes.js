// 🗝️ Mensajes de "Ezequiel, el Archivero" — minijuego "Construye la Constitución"
//
// Importante: ninguno de estos mensajes debe contener números de artículo
// concretos, porque cualquiera de ellos podría coincidir justo con la
// planta que el usuario está intentando resolver en ese momento y
// desvelaría la respuesta sin querer. Los números solo deben aparecer en
// las PISTAS, que se generan aparte (en el componente, no aquí) y solo
// tras varios fallos en esa planta concreta.

export const MENSAJES_ANDER_EGG = [
  { tipo: "curiosidad", texto: "El Título I es uno de los más preguntados en las oposiciones." },
  { tipo: "curiosidad", texto: "Comprender la estructura ayuda mucho más que memorizar números sueltos." },
  { tipo: "curiosidad", texto: "Cada título agrupa derechos y materias relacionadas entre sí, no están puestos al azar." },
  { tipo: "curiosidad", texto: "El orden de los títulos sigue una lógica de importancia y generalidad." },
  { tipo: "curiosidad", texto: "Muchas oposiciones dedican preguntas solo a la estructura, sin entrar en el contenido de cada artículo." },

  { tipo: "estudio", texto: "Intenta recordar primero la estructura general y después los artículos concretos." },
  { tipo: "estudio", texto: "Cuando entiendes dónde está un artículo, después es mucho más fácil recordarlo." },
  { tipo: "estudio", texto: "Construir un mapa mental suele funcionar mejor que memorizar de forma aislada." },
  { tipo: "estudio", texto: "Repasar poco a poco, varios días seguidos, funciona mejor que un solo repaso largo." },

  { tipo: "biografia", texto: "Ezequiel Ander-Egg dedicó gran parte de su trabajo a la planificación social y al desarrollo comunitario." },
  { tipo: "biografia", texto: "Ha escrito numerosos libros sobre metodología y planificación." },
  { tipo: "biografia", texto: "Sus obras siguen siendo una referencia para muchos profesionales del Trabajo Social." }
];