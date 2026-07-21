import { useEffect, useState } from 'react';
import imagenDespachoAbierta from '../assets/kit/explorador/puerta-despacho.png';
import { calcularTransformDesdeHotspot } from './zoomMath';

const DURACION_FEEDBACK = 130;
const DURACION_ZOOM = 600;
const DURACION_CROSSFADE = 450; // pasillo (puerta cerrada) -> despacho (puerta abierta)
const DURACION_LUZ = 400;       // el velo blanco va invadiendo la imagen del despacho
const DURACION_FUNDIDO = 150;   // fundido blanco total, antes de mostrar el artículo
const EASING = 'cubic-bezier(0.83, 0, 0.17, 1)';

/**
 * Transición especial para Pasillo -> Artículo (y su vuelta).
 * Secuencia: zoom hacia la puerta -> crossfade a la imagen de la puerta ya
 * abierta (despacho) -> velo blanco creciendo -> fundido total -> artículo.
 * La vuelta atrás reproduce exactamente esta secuencia en orden inverso.
 */
export default function DoorTransition({ nivelPasillo, hotspotPuerta, direccion, onComplete }) {
  const [fase, setFase] = useState('');
  const datos = calcularTransformDesdeHotspot(hotspotPuerta);

  useEffect(() => {
    let cancelado = false;
    const secuencia = direccion === 'entrar'
      ? [
          ['feedback', DURACION_FEEDBACK],
          ['zoom-in', DURACION_ZOOM],
          ['despacho', DURACION_CROSSFADE],
          ['luz', DURACION_LUZ],
          ['fundido', DURACION_FUNDIDO],
        ]
      : [
          ['fundido', DURACION_FUNDIDO],
          ['luz', DURACION_LUZ],
          ['despacho', DURACION_CROSSFADE],
          ['zoom-out', DURACION_ZOOM],
        ];

    let i = 0;
    function avanzar() {
      if (cancelado) return;
      const [nombre, duracion] = secuencia[i];
      setFase(nombre);
      i += 1;
      if (i < secuencia.length) {
        setTimeout(avanzar, duracion);
      } else {
        setTimeout(onComplete, duracion);
      }
    }
    avanzar();
    return () => { cancelado = true; };
  }, [direccion]); // eslint-disable-line react-hooks/exhaustive-deps

  const acercandose = fase === 'zoom-in' || fase === 'despacho' || fase === 'luz' || fase === 'fundido';
  const transformPasillo = acercandose ? datos.transform : 'scale(1) translate(0,0)';

  const mostrarDespacho = fase === 'despacho' || fase === 'luz' || fase === 'fundido';
  const opacidadLuz = fase === 'luz' || fase === 'fundido' ? 1 : 0;
  const opacidadFundido = fase === 'fundido' ? 1 : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#1a1410', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>

        {/* El pasillo, con zoom hacia la puerta pulsada */}
        <div style={{
          position: 'relative', width: '100%', transformOrigin: 'center center',
          willChange: 'transform', transition: `transform ${DURACION_ZOOM}ms ${EASING}`,
          transform: transformPasillo,
        }}>
          {nivelPasillo}
        </div>

        {/* La imagen de la puerta ya abierta + despacho, en crossfade sobre el pasillo */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: mostrarDespacho ? 1 : 0,
          transition: `opacity ${DURACION_CROSSFADE}ms ease-in-out`,
        }}>
          <img
            src={imagenDespachoAbierta}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Velo blanco que va "invadiendo" esta misma imagen */}
          <div style={{
            position: 'absolute', inset: 0, background: '#fffaf2',
            opacity: opacidadLuz,
            transition: `opacity ${DURACION_LUZ}ms ease-in`,
          }} />
        </div>

        {/* Fundido blanco total, capa superior */}
        <div style={{
          position: 'absolute', inset: 0, background: '#fffaf2', pointerEvents: 'none',
          opacity: opacidadFundido,
          transition: `opacity ${DURACION_FUNDIDO}ms ease-out`,
        }} />
      </div>
    </div>
  );
}