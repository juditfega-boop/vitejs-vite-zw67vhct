import { useRef } from 'react';

const DURACION_ZOOM = 600; // ms
// Curva muy marcada: arranca despacio, acelera fuerte en el centro, frena al llegar
const EASING = 'cubic-bezier(0.83, 0, 0.17, 1)';
const ESCALA_MAXIMA = 4.2;   // cuánto se acerca la imagen ACTUAL sobre la puerta pulsada
const ESCALA_ENTRADA = 5.5;  // desde qué tamaño "nace" la imagen SIGUIENTE

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
    return { transform: `scale(${escala}) translate(${dx}%, ${dy}%)`, cx, cy };
  }

  const datosTransform = calcularTransform(hotspotSeleccionado);
  const transformActual = fase === 'zoom-in' ? datosTransform.transform : 'scale(1) translate(0,0)';

  const estiloContenedor = {
    position: 'relative',
    width: '100%',
    aspectRatio: '2 / 3',
    overflow: 'hidden',
    background: '#1a1410', // se ve un instante en el pico del zoom, mejor oscuro que blanco
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

  // Viñeta: oscurece todo menos un "foco" alrededor de la puerta pulsada.
  // Se mueve y escala EXACTAMENTE igual que la imagen actual (mismo transform),
  // así el foco de luz se queda centrado en la puerta durante todo el zoom.
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
    <div ref={contenedorRef} style={estiloContenedor}>
      <div style={estiloActual}>{nivelActual}</div>
      <div style={estiloVineta} />
      {nivelSiguiente && <div style={estiloSiguiente}>{nivelSiguiente}</div>}
    </div>
  );
}