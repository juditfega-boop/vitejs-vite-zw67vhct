import { TituloHub, SubtituloMano, Fila, COLOR_SECCION } from "./Hub";
import { HOY_TE_TOCA } from "./MiCalendario";
import iconoGrafico from "../assets/kit/icono-grafico-evolucion.png";
import iconoCalendario from "../assets/kit/icono-calendario-inicio.png";
import iconoSobre from "../assets/kit/icono-buzon-sobre.png";
import iconoTaza from "../assets/kit/icono-taza-perfil.png";
import iconoImpugnaciones from "../assets/kit/icono-explicacion-libreta.png";
import iconoInstrucciones from "../assets/kit/icono-taza-plantita-evolucion.png";

// 🗂️ MI EXPEDIENTE: todo lo tuyo en un mismo sitio
export default function MiExpediente({ usuario, aprobada, mostrarBloqueo, calendario, irA, verInstrucciones }) {
  const c = COLOR_SECCION.expediente;
  const tipo = usuario ? calendario.tipoHoy : null;
  const textoCalendario = tipo
    ? `Hoy te toca: ${HOY_TE_TOCA[tipo].texto}`
    : usuario
    ? "Hoy no tienes nada marcado"
    : "Planifica tus días de estudio";

  return (
    <>
      <TituloHub titulo="Mi expediente" color={c.linea} />

      <SubtituloMano style={{ marginTop: 6 }}>Mi estudio</SubtituloMano>
      <Fila guia="evolucion" icono={iconoGrafico} nombre="Evolución" texto="Tus estadísticas, en general y por bloques" onClick={() => irA("estudiar-progreso")} />
      <Fila
        guia="calendario"
        icono={iconoCalendario}
        nombre="Calendario"
        texto={textoCalendario}
        bloqueado={mostrarBloqueo}
        onClick={() => irA("calendario")}
      />

      <SubtituloMano>Mis compis</SubtituloMano>
      <Fila
        guia="compis"
        icono={iconoSobre}
        nombre="Manda un hechizo mágico"
        texto="Tus compis, sus hechizos y «¿Hoy te cuesta?»"
        bloqueado={!usuario || !aprobada}
        onClick={() => irA(usuario && aprobada ? "compis" : "ajustes")}
      />

      <SubtituloMano>Mi cuenta</SubtituloMano>
      <Fila guia="perfil" icono={iconoTaza} nombre="Perfil" texto="Tu cuenta, tu nombre en la app y tu código" onClick={() => irA("ajustes")} />
      <Fila
        icono={iconoImpugnaciones}
        nombre="Impugnaciones"
        texto="Las preguntas que has impugnado"
        onClick={() => irA("impugnaciones")}
      />
      <Fila
        icono={iconoInstrucciones}
        nombre="Instrucciones"
        texto="Vuelve a ver la visita guiada"
        onClick={verInstrucciones}
      />
    </>
  );
}
