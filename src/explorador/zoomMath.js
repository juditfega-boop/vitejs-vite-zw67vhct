export const ESCALA_MAXIMA_ZOOM = 4.2;

// Única fuente de verdad para "a qué escala y hacia dónde hay que mover la
// cámara para que esta puerta llene la pantalla". La usan ZoomTransition y
// DoorTransition — así ambas transiciones son consistentes entre sí.
export function calcularTransformDesdeHotspot(hotspot, escalaMaxima = ESCALA_MAXIMA_ZOOM) {
  if (!hotspot) return { transform: 'scale(1) translate(0,0)', cx: 50, cy: 50 };
  const cx = parseFloat(hotspot.left) + parseFloat(hotspot.width) / 2;
  const cy = parseFloat(hotspot.top) + parseFloat(hotspot.height) / 2;
  const escalaX = 100 / parseFloat(hotspot.width);
  const escalaY = 100 / parseFloat(hotspot.height);
  const escala = Math.min(Math.max(escalaX, escalaY), escalaMaxima);
  const dx = 50 - cx;
  const dy = 50 - cy;
  return { transform: `scale(${escala}) translate(${dx}%, ${dy}%)`, cx, cy };
}