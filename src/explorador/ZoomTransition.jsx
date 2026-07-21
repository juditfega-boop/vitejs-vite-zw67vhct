import { useRef, useState, useLayoutEffect } from 'react';

const DURACION_ZOOM = 600; // ms
const EASING = 'cubic-bezier(0.83, 0, 0.17, 1)';
const ESCALA_MAXIMA = 4.2;
const ESCALA_ENTRADA = 5.5;

export default function ZoomTransition({
  nivelActual,
  nivelSiguiente,
  hotspotSeleccionado,
  fase,
}) {
  const contenedorRef = useRef(null);
  const [anchoPx, setAnchoPx] = useState(null);

  // Medimos el ancho real del padre en píxeles, en vez de confiar en que
  // el % se resuelva bien dentro del posicionamiento absoluto anidado.
  useLayoutEffect(() => {
    function medir() {
      if (contenedorRef.current && contenedorRef.current.parentElement) {
        setAnchoPx(contenedorRef.current.parentElement.clientWidth);
      }
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  function calcularTransform(hotspot) {
    if (!hotspot) return { transform: 'scale(1) translate(0, 0)', cx: 50, cy: 50 };
    const cx = parseFloat(hotspot.left) + parseFloat(hotspot.width) / 2;
    const cy = parseFloat(hotspot.top) + parseFloat(hotspot.height) / 2;
    const escalaX = 100 / parseFloat(hotspot.width);
    const escalaY = 100 / parseFloat(hotspot.height);
    const escala = Math.min(Math.max(escalaX, escalaY), ESCALA_MAXIMA);
    const dx = 50 - cx;
    const dy = 50 - cy;
    return { transform: `scale(${escala}) translate(${dx}%, ${dy}%)`, cx, cy };
  }

  const datosTransform = calcularTransform(hotspotSeleccionado);
  const transformActual = fase === 'zoom-in' ? datosTransform.transform : 'scale(1) translate(0,0)';

  // Caja con proporción fija SIN depender de aspect-ratio: el padding-bottom
  // en % siempre se calcula sobre el ancho real del propio elemento, así que
  // es inmune a problemas de layout flex/grid del contenedor padre.
  const estiloContenedorExterior = {
    position: 'relative',
    width: anchoPx ? `${anchoPx}px` : '100%',
  };
  const estiloCajaProporcion = {
    width: '100%',
    paddingBottom: '150%', // 2:3 -> alto = ancho * 1.5
  };
  const estiloCapaAbsoluta = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: '#1a1410',
  };

  const estiloActual = {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'center center',
    willChange: 'transform',
    transition: fase === 'zoom-in' ? `transform ${DURACION_ZOOM}ms ${EASING}` : 'none',
    transform: transformActual,
    opacity: fase === 'zoom-out' ? 0 : 1,
    zIndex: fase === 'zoom-out' ? 1 : 2,
  };

  const estiloSiguiente = {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'center center',
    willChange: 'transform',
    transition: fase === 'zoom-out' ? `transform ${DURACION_ZOOM}ms ${EASING}` : 'none',
    transform: fase === 'zoom-out' ? 'scale(1) translate(0,0)' : `scale(${ESCALA_ENTRADA}) translate(0,0)`,
    opacity: fase === 'zoom-out' ? 1 : 0,
    zIndex: fase === 'zoom-out' ? 2 : 1,
  };

  const mostrarVineta = hotspotSeleccionado && (fase === 'feedback' || fase === 'zoom-in');
  const estiloVineta = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    transformOrigin: 'center center',
    transition: fase === 'zoom-in'
      ? `transform ${DURACION_ZOOM}ms ${EASING}, opacity ${DURACION_ZOOM}ms ease-out`
      : 'opacity 150ms ease-out',
    transform: transformActual,
    opacity: mostrarVineta ? 1 : 0,
    zIndex: 3,
    background: hotspotSeleccionado
      ? `radial-gradient(circle at ${datosTransform.cx}% ${datosTransform.cy}%, rgba(0,0,0,0) 12%, rgba(20,14,10,0.65) 55%)`
      : 'transparent',
  };

  return (
    <div ref={contenedorRef} style={estiloContenedorExterior}>
      <div style={estiloCajaProporcion} />
      <div style={estiloCapaAbsoluta}>
        <div style={estiloActual}>{nivelActual}</div>
        <div style={estiloVineta} />
        {nivelSiguiente && <div style={estiloSiguiente}>{nivelSiguiente}</div>}
      </div>
    </div>
  );
}