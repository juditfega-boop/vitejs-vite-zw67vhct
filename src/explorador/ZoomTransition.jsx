import { useRef } from 'react';

const DURACION_ZOOM = 550; // ms
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const ESCALA_MAXIMA = 3.2;

export default function ZoomTransition({
  nivelActual,
  nivelSiguiente,
  hotspotSeleccionado,
  fase, // 'reposo' | 'feedback' | 'zoom-in' | 'zoom-out'
}) {
  const contenedorRef = useRef(null);

  function calcularTransform(hotspot) {
    if (!hotspot) return 'scale(1) translate(0, 0)';
    const cx = parseFloat(hotspot.left) + parseFloat(hotspot.width) / 2;
    const cy = parseFloat(hotspot.top) + parseFloat(hotspot.height) / 2;
    const escalaX = 100 / parseFloat(hotspot.width);
    const escalaY = 100 / parseFloat(hotspot.height);
    const escala = Math.min(Math.max(escalaX, escalaY), ESCALA_MAXIMA);
    const dx = 50 - cx;
    const dy = 50 - cy;
    return `scale(${escala}) translate(${dx}%, ${dy}%)`;
  }

  // El contenedor SIEMPRE tiene esta proporción fija — nunca depende
  // de qué fase de la animación esté activa ni de qué imagen se vea.
  const estiloContenedor = {
    position: 'relative',
    width: '100%',
    aspectRatio: '2 / 3',
    overflow: 'hidden',
  };

  const estiloActual = {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'center center',
    willChange: 'transform',
    transition: fase === 'zoom-in' ? `transform ${DURACION_ZOOM}ms ${EASING}` : 'none',
    transform: fase === 'zoom-in' ? calcularTransform(hotspotSeleccionado) : 'scale(1) translate(0,0)',
    opacity: fase === 'zoom-out' ? 0 : 1,
    zIndex: fase === 'zoom-out' ? 1 : 2,
  };

  const estiloSiguiente = {
    position: 'absolute',
    inset: 0,
    transformOrigin: 'center center',
    willChange: 'transform',
    transition: fase === 'zoom-out' ? `transform ${DURACION_ZOOM}ms ${EASING}` : 'none',
    transform: fase === 'zoom-out' ? 'scale(1) translate(0,0)' : `scale(${ESCALA_MAXIMA}) translate(0,0)`,
    opacity: fase === 'zoom-in' || fase === 'reposo' ? 0 : 1,
    zIndex: fase === 'zoom-out' ? 2 : 1,
  };

  return (
    <div ref={contenedorRef} style={estiloContenedor}>
      <div style={estiloActual}>{nivelActual}</div>
      {nivelSiguiente && <div style={estiloSiguiente}>{nivelSiguiente}</div>}
    </div>
  );
}