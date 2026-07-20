import { useState, useMemo } from 'react';

// Encuentra un nodo del árbol siguiendo una ruta de ids
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

export default function LawExplorer({ data, skin, getNodeState, onLeafAction }) {
  // rutaIds: array de ids desde la raíz hasta donde estamos ahora
  const [rutaIds, setRutaIds] = useState([]);
  const [direccion, setDireccion] = useState('adelante');

  const ruta = useMemo(() => resolverRuta(data, rutaIds), [data, rutaIds]);
  const nodoActual = ruta[ruta.length - 1];
  const esHoja = !nodoActual.children || nodoActual.children.length === 0;
  const profundidad = ruta.length - 1;

  function irAHijo(childId) {
    setDireccion('adelante');
    setRutaIds([...rutaIds, childId]);
  }

  function volver() {
    setDireccion('atras');
    setRutaIds(rutaIds.slice(0, -1));
  }

  // Elegimos qué componente de la piel dibuja este nivel
  const Renderer = esHoja
  ? skin.leaf
  : (skin[nodoActual.vistaHijos] || skin.default);

  if (!Renderer) {
    return <div>Falta un renderer para la profundidad {profundidad} en el skin.</div>;
  }

  return (
    <div className={`explorador-transicion explorador-${direccion}`}>
      <Renderer
        node={nodoActual}
        ruta={ruta}
        onSelect={irAHijo}
        onBack={rutaIds.length > 0 ? volver : null}
        getNodeState={getNodeState}
        onLeafAction={esHoja ? () => onLeafAction(nodoActual) : null}
      />
    </div>
  );
}