import { useState } from 'react';
import ZoomTransition from './ZoomTransition';
import dataConstitucion from './data/constitucion.json';
import imagenesExplorador from './imagenesRegistry';

const DURACION_FEEDBACK = 130;
const DURACION_ZOOM = 550;

export default function PrototipoZoom() {
  const [fase, setFase] = useState('reposo');
  const [hotspotActivo, setHotspotActivo] = useState(null);

  const vistaGeneral = dataConstitucion;
  const tituloI = dataConstitucion.children.find((t) => t.id === 'titulo-1');

  function pulsarTituloI() {
    const hotspot = vistaGeneral.hotspots['titulo-1'];
    setHotspotActivo(hotspot);
    setFase('feedback');

    setTimeout(() => {
      setFase('zoom-in');
      setTimeout(() => {
        setFase('zoom-out');
        setTimeout(() => setFase('reposo'), DURACION_ZOOM);
      }, DURACION_ZOOM);
    }, DURACION_FEEDBACK);
  }

  function renderEdificio(node, onPulsar, escalaFeedback) {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src={imagenesExplorador[node.imagenFondo]}
          alt={node.label}
          style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }}
        />
        {Object.entries(node.hotspots || {}).map(([id, h]) => (
          <button
            key={id}
            onClick={id === 'titulo-1' ? onPulsar : undefined}
            style={{
              position: 'absolute',
              top: h.top, left: h.left, width: h.width, height: h.height,
              background: 'transparent',
              border: 'none',
              cursor: id === 'titulo-1' ? 'pointer' : 'default',
              transform: id === 'titulo-1' ? `scale(${escalaFeedback})` : 'none',
              transition: 'transform 130ms ease-out, box-shadow 130ms ease-out',
              boxShadow: id === 'titulo-1' && escalaFeedback > 1 ? '0 4px 14px rgba(0,0,0,0.25)' : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  const escalaFeedback = fase === 'feedback' ? 1.04 : 1;

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <p style={{ textAlign: 'center', color: '#8a7d6f' }}>
        Prototipo — pulsa la puerta de Título I en la vista general
      </p>
      <ZoomTransition
        fase={fase}
        hotspotSeleccionado={hotspotActivo}
        nivelActual={renderEdificio(vistaGeneral, pulsarTituloI, escalaFeedback)}
        nivelSiguiente={fase !== 'reposo' && fase !== 'feedback' ? renderEdificio(tituloI, null, 1) : null}
      />
    </div>
  );
}