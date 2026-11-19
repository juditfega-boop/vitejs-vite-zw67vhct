import { TituloHub, SubtituloMano, Fila, COLOR_SECCION } from "./Hub";
import { HOY_TE_TOCA } from "./MiCalendario";
import iconoGrafico from "../assets/kit/icono-grafico-evolucion.png";
import iconoCalendario from "../assets/kit/icono-calendario-inicio.png";
import iconoTarjetero from "../assets/kit/icono-tarjetero.png";
import iconoSobre from "../assets/kit/icono-buzon-sobre.png";
import iconoTaza from "../assets/kit/icono-taza-perfil.png";
import iconoImpugnaciones from "../assets/kit/icono-explicacion-libreta.png";

// 🗂️ MI EXPEDIENTE: todo lo tuyo en un mismo sitio
export default function MiExpediente({ usuario, aprobada, mostrarBloqueo, calendario, irA }) {
  const c = COLOR_SECCION.expediente;
  const tipo = usuario ? calendario.tipoHoy : null;
  const textoCalendario = tipo
    ? `Hoy te toca: ${HOY_TE_TOCA[tipo].texto}`
    : usuario
    ? "Hoy no tienes nada marcado"
    : "Planifica tus días de estudio";

  return (
    <>
      <TituloHub titulo="Mi expediente" subtitulo="Tu progreso, tu plan y tu gente" color={c.linea} />

      <SubtituloMano style={{ marginTop: 6 }}>Mi estudio</SubtituloMano>
      <Fila icono={iconoGrafico} nombre="Evolución" texto="Tus estadísticas, en general y por bloques" color={c.fondo} onClick={() => irA("estudiar-progreso")} />
      <Fila
        icono={iconoCalendario}
        nombre="Calendario"
        texto={textoCalendario}
        color={c.fondo}
        bloqueado={mostrarBloqueo}
        onClick={() => irA("calendario")}
      />
      <Fila
        icono={iconoTarjetero}
        nombre="Tarjetero"
        texto="Tus resúmenes, ordenados en carpetas"
        color={c.fondo}
        bloqueado={mostrarBloqueo}
        onClick={() => irA("tarjetero")}
      />

      <SubtituloMano>Mis compis</SubtituloMano>
      <Fila
        icono={iconoSobre}
        nombre="Manda un hechizo mágico"
        texto="Tu código, tus compis y sus hechizos"
        color={COLOR_SECCION.test.fondoClaro}
        bloqueado={!usuario || !aprobada}
        onClick={() => irA(usuario && aprobada ? "compis" : "ajustes")}
      />

      <SubtituloMano>Mi cuenta</SubtituloMano>
      <Fila icono={iconoTaza} nombre="Perfil" texto="Tu cuenta y tu sesión" color={COLOR_SECCION.estudiar.fondoClaro} onClick={() => irA("ajustes")} />
      <Fila
        icono={iconoImpugnaciones}
        nombre="Impugnaciones"
        texto="Las preguntas que has impugnado"
        color={COLOR_SECCION.estudiar.fondoClaro}
        onClick={() => irA("impugnaciones")}
      />
    </>
  );
}
