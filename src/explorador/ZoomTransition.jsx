const DURACION_ZOOM = 600;
const EASING = 'cubic-bezier(0.83, 0, 0.17, 1)';
import { calcularTransformDesdeHotspot } from './zoomMath';

const ESCALA_ENTRADA = 5.5;
const ANCHO_MAX = 560;

export default function ZoomTransition({ nivelActual, nivelSiguiente, hotspotSeleccionado, fase }) {
  const datosTransform = calcularTransformDesdeHotspot(hotspotSeleccionado);
  const transformActual = fase === 'zoom-in' ? datosTransform.transform : 'scale(1) translate(0,0)';

  const estiloOverlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 500,
    background: '#1a1410',
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden', // recorta lo que se salga de pantalla durante el zoom, sin dar scroll
  };

  const estiloLienzo = {
    position: 'relative',
    width: '100%',
    maxWidth: ANCHO_MAX,
  };

  // CLAVE: nivelActual sigue "en flujo" (no absolute), así define la altura
  // real del lienzo exactamente igual que en reposo — misma caja, mismas
  // coordenadas de puertas, sin inventar ninguna proporción nueva.
  const estiloActual = {
    position: 'relative',
    width: '100%',
    transformOrigin: 'center center',
    willChange: 'transform',
    transition: fase === 'zoom-in' ? `transform ${DURACION_ZOOM}ms ${EASING}` : 'none',
    transform: transformActual,
    opacity: fase === 'zoom-out' ? 0 : 1,
    zIndex: fase === 'zoom-out' ? 1 : 2,
  };

  // nivelSiguiente sí es absolute, pero "inset:0" ahora se mide respecto a la
  // caja real que acaba de definir nivelActual (su hermano en flujo), no
  // respecto a un rectángulo 2:3 inventado.
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
    <div style={estiloOverlay}>
      <div style={estiloLienzo}>
        <div style={estiloActual}>{nivelActual}</div>
        <div style={estiloVineta} />
        {nivelSiguiente && <div style={estiloSiguiente}>{nivelSiguiente}</div>}
      </div>
    </div>
  );
}