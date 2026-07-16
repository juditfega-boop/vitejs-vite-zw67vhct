// 📁 Expediente "Artículos y contenido" — minijuego "Conecta la Constitución"
//
// Archivo independiente del banco de preguntas. El juego espera un array
// de objetos con esta forma:
//
//   {
//     id: número único,
//     capituloNumero: "I" | "II" | "III"...   (para agrupar en el resumen)
//     capituloNombre: nombre completo del capítulo,
//     articulo: número de artículo (opcional si usas "etiqueta")
//     etiqueta: texto alternativo para la tarjeta izquierda
//     descripcion: el texto con el que hay que emparejarlo
//   }
//
// 👉 Para añadir más contenido tú misma, copia cualquier línea de abajo,
// cambia el "id" por uno que no hayas usado, y rellena el resto.

export const ARTICULOS_CONSTITUCION = [
    { id: 1, capituloNumero: "I", capituloNombre: "De los españoles y los extranjeros", articulo: 11, descripcion: "Regula la adquisición, conservación y pérdida de la nacionalidad española." },
    { id: 2, capituloNumero: "I", capituloNombre: "De los españoles y los extranjeros", articulo: 13, descripcion: "Reconoce las libertades públicas de los extranjeros en España conforme a los tratados y la ley." },
  
    { id: 3, capituloNumero: "II", capituloNombre: "Derechos y libertades", articulo: 14, descripcion: "Igualdad de todos los españoles ante la ley, sin discriminación." },
    { id: 4, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 15, descripcion: "Derecho a la vida y a la integridad física y moral." },
    { id: 5, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 16, descripcion: "Libertad ideológica, religiosa y de culto." },
    { id: 6, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 17, descripcion: "Derecho a la libertad y a la seguridad personal." },
    { id: 7, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 18, descripcion: "Derecho al honor, la intimidad personal y familiar y la propia imagen." },
    { id: 8, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 19, descripcion: "Libertad de residencia y de circulación por el territorio nacional." },
    { id: 9, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 20, descripcion: "Libertad de expresión y derecho a comunicar y recibir información veraz." },
    { id: 10, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 21, descripcion: "Derecho de reunión pacífica y sin armas." },
    { id: 11, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 22, descripcion: "Derecho de asociación." },
    { id: 12, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 23, descripcion: "Derecho a participar en los asuntos públicos y a acceder a cargos públicos." },
    { id: 13, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 24, descripcion: "Derecho a la tutela judicial efectiva y a un proceso con todas las garantías." },
    { id: 14, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 27, descripcion: "Derecho a la educación y libertad de enseñanza." },
    { id: 15, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 1ª", articulo: 28, descripcion: "Libertad sindical y derecho de huelga." },
    { id: 16, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 2ª", articulo: 32, descripcion: "Derecho del hombre y la mujer a contraer matrimonio en plena igualdad jurídica." },
    { id: 17, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 2ª", articulo: 33, descripcion: "Derecho a la propiedad privada y a la herencia." },
    { id: 18, capituloNumero: "II", capituloNombre: "Derechos y libertades. Sección 2ª", articulo: 35, descripcion: "Derecho al trabajo y a una remuneración suficiente." },
  
    { id: 19, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 39, descripcion: "Los padres deben prestar asistencia a los hijos, dentro o fuera del matrimonio." },
    { id: 20, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 40, descripcion: "Promoción del progreso social, económico y del pleno empleo." },
    { id: 21, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 41, descripcion: "Mantenimiento de un régimen público de Seguridad Social para todos los ciudadanos." },
    { id: 22, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 43, descripcion: "Reconoce el derecho a la protección de la salud." },
    { id: 23, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 45, descripcion: "Derecho a disfrutar de un medio ambiente adecuado para el desarrollo de la persona." },
    { id: 24, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 47, descripcion: "Derecho a disfrutar de una vivienda digna y adecuada." },
    { id: 25, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 49, descripcion: "Atención especializada, tratamiento y rehabilitación de las personas con discapacidad." },
    { id: 26, capituloNumero: "III", capituloNombre: "Principios rectores de la política social y económica", articulo: 50, descripcion: "Garantía de suficiencia económica a los ciudadanos durante la tercera edad." },
  
    { id: 27, capituloNumero: "IV", capituloNombre: "Garantías de las libertades y derechos fundamentales", articulo: 53, descripcion: "Vincula a todos los poderes públicos al respeto de los derechos fundamentales." },
    { id: 28, capituloNumero: "IV", capituloNombre: "Garantías de las libertades y derechos fundamentales", articulo: 54, descripcion: "Crea la institución del Defensor del Pueblo." },
  
    { id: 29, capituloNumero: "V", capituloNombre: "Suspensión de los derechos y libertades", articulo: 55, descripcion: "Regula la suspensión de determinados derechos en estados de excepción o sitio." },
    { id: 30, capituloNumero: "V", capituloNombre: "Suspensión de los derechos y libertades", articulo: 116, descripcion: "Regula los estados de alarma, excepción y sitio." },
    { id: 31, capituloNumero: "V", capituloNombre: "Suspensión de los derechos y libertades", etiqueta: "Ley Orgánica 4/1981", descripcion: "De 1 de junio, reguladora de los estados de alarma, excepción y sitio." },
  
  ];