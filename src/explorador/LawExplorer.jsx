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
  
  // Busca un nodo en cualquier profundidad del árbol y devuelve la lista
  // de ids desde la raíz hasta él (para los "atajos").
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

  // Para los "atajos": salta directamente a un nodo aunque no sea hijo
  // inmediato (ej. el Artículo 14 desde la pantalla de Capítulo II).
  function irAId(idDestino) {
    const rutaCompleta = encontrarRutaCompleta(data, idDestino);
    if (rutaCompleta) {
      setDireccion('adelante');
      setRutaIds(rutaCompleta);
    }
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
        onJump={irAId}
        onBack={rutaIds.length > 0 ? volver : null}
        getNodeState={getNodeState}
        onLeafAction={esHoja ? () => onLeafAction(nodoActual) : null}
      />
    </div>
  );
}