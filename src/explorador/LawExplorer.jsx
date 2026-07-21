import { useState, useMemo } from 'react';
import ZoomTransition from './ZoomTransition';

const DURACION_FEEDBACK = 130;
const DURACION_ZOOM = 600;

function resolverRuta(raiz, ids) {
  let nodoActual = raiz;
  const ruta = [raiz];
  for (const id of ids) {
    const siguiente = (nodoActual.children || []).find(n => n.id === id);
    if (!siguiente) break;
    nodoActual = siguiente;
    ruta.push(nodoActual);
  }
  return ruta;
}

function encontrarRutaCompleta(raiz, idBuscado) {
  function buscar(nodo, camino) {
    if (nodo.id === idBuscado) return camino;
    for (const hijo of nodo.children || []) {
      const resultado = buscar(hijo, [...camino, hijo.id]);
      if (resultado) return resultado;
    }
    return null;
  }
  return buscar(raiz, []);
}

export default function LawExplorer({ data, skin, getNodeState, onLeafAction }) {
  const [rutaIds, setRutaIds] = useState([]);
  const [fase, setFase] = useState('reposo'); // reposo | feedback | zoom-in | zoom-out
  const [hotspotActivo, setHotspotActivo] = useState(null);
  const [rutaIdsDestino, setRutaIdsDestino] = useState(null);

  const ruta = useMemo(() => resolverRuta(data, rutaIds), [data, rutaIds]);
  const nodoActual = ruta[ruta.length - 1];

  const rutaDestinoResuelta = useMemo(
    () => (rutaIdsDestino ? resolverRuta(data, rutaIdsDestino) : null),
    [data, rutaIdsDestino]
  );
  const nodoDestino = rutaDestinoResuelta ? rutaDestinoResuelta[rutaDestinoResuelta.length - 1] : null;

  function rendererDe(nodo) {
    if (!nodo) return null;
    const esHoja = !nodo.children || nodo.children.length === 0;
    return esHoja ? skin.leaf : (skin[nodo.vistaHijos] || skin.default);
  }

  function animarHacia(idsDestino, hotspot) {
    setHotspotActivo(hotspot);
    setRutaIdsDestino(idsDestino);
    setFase('feedback');
    setTimeout(() => {
      setFase('zoom-in');
      setTimeout(() => {
        setFase('zoom-out');
        setTimeout(() => {
          setRutaIds(idsDestino);
          setRutaIdsDestino(null);
          setFase('reposo');
          setHotspotActivo(null);
        }, DURACION_ZOOM);
      }, DURACION_ZOOM);
    }, DURACION_FEEDBACK);
  }

  function irAHijo(childId) {
    if (fase !== 'reposo') return;
    const hotspot = (nodoActual.hotspots || {})[childId];
    const atajo = (nodoActual.atajos || {})[childId];
    const idsDestino = atajo ? encontrarRutaCompleta(data, childId) : [...rutaIds, childId];

    if (!hotspot && !atajo) {
      setRutaIds(idsDestino); // sin coordenadas conocidas: navega sin animar
      return;
    }
    animarHacia(idsDestino, hotspot || atajo);
  }

  function volver() {
    if (fase !== 'reposo' || rutaIds.length === 0) return;
    const idsDestino = rutaIds.slice(0, -1);
    const padre = resolverRuta(data, idsDestino).slice(-1)[0];
    const hotspot = (padre.hotspots || {})[nodoActual.id] || (padre.atajos || {})[nodoActual.id];

    if (!hotspot) {
      setRutaIds(idsDestino);
      return;
    }
    animarHacia(idsDestino, hotspot);
  }

  function irAId(idDestino) {
    if (fase !== 'reposo') return;
    const rutaCompleta = encontrarRutaCompleta(data, idDestino);
    if (rutaCompleta) setRutaIds(rutaCompleta);
  }

  function renderNodo(nodo, interactivo) {
    const Renderer = rendererDe(nodo);
    if (!Renderer) return <div>Falta un renderer para "{nodo.vistaHijos}"</div>;
    return (
      <Renderer
        node={nodo}
        ruta={interactivo ? ruta : (rutaDestinoResuelta || ruta)}
        onSelect={interactivo ? irAHijo : () => {}}
        onJump={interactivo ? irAId : () => {}}
        onBack={interactivo && rutaIds.length > 0 ? volver : null}
        getNodeState={getNodeState}
        onLeafAction={
          interactivo && (!nodo.children || nodo.children.length === 0)
            ? () => onLeafAction(nodo)
            : null
        }
      />
    );
  }

  if (fase === 'reposo') {
    return <div style={{ position: 'relative', width: '100%' }}>{renderNodo(nodoActual, true)}</div>;
  }

  return (
    <ZoomTransition
      fase={fase}
      hotspotSeleccionado={hotspotActivo}
      nivelActual={renderNodo(nodoActual, false)}
      nivelSiguiente={nodoDestino ? renderNodo(nodoDestino, false) : null}
    />
  );
}