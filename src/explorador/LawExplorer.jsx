import { useState, useMemo, useEffect, useRef } from 'react';
import PasoPuerta from './PasoPuerta';
import imagenesExplorador from './imagenesRegistry';
import PUERTAS from './data/puertas';
import LlaveSala, { llavesDeHoy, guardarLlave } from './LlaveSala';

// 🖼️ precarga: las imágenes se descargan y preparan antes de necesitarlas
const imagenesPreparadas = {};
function prepararImagen(clave) {
  const src = clave ? imagenesExplorador[clave] : null;
  if (!src) return Promise.resolve();
  if (!imagenesPreparadas[src]) {
    const img = new Image();
    img.src = src;
    imagenesPreparadas[src] = {
      img,
      lista: (img.decode ? img.decode() : Promise.resolve()).catch(() => {})
    };
  }
  return imagenesPreparadas[src].lista;
}

// espera a que la imagen esté lista, pero nunca más de 1,5 s (por si la conexión va lenta)
function esperarImagen(clave) {
  return Promise.race([prepararImagen(clave), new Promise((r) => setTimeout(r, 1500))]);
}

const esHojaNodo = (n) => n && (!n.children || n.children.length === 0);

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

// 🔑 de qué artículo a qué artículo va una sala (sale solo del JSON: los números de sus artículos)
function rangoDe(nodo) {
  const numeros = [];
  (function recorrer(n) {
    if (esHojaNodo(n)) {
      const m = /(\d+)/.exec(n.id);
      if (m) numeros.push(Number(m[1]));
    } else {
      (n.children || []).forEach(recorrer);
    }
  })(nodo);
  return numeros.length ? { desde: Math.min(...numeros), hasta: Math.max(...numeros) } : null;
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

// 🚪 la puerta que lleva de una sala a uno de sus hijos: la exacta si está en puertas.js;
// si no, su zona de pulsar, que se cruza como un arco
function puertaDe(sala, hijoId) {
  const exacta = (PUERTAS[sala.id] || {})[hijoId];
  if (exacta) return exacta;
  const zona = (sala.hotspots || {})[hijoId] || (sala.atajos || {})[hijoId];
  return zona ? { tipo: 'arco', ...zona } : null;
}

export default function LawExplorer({ data, skin, getNodeState, onLeafAction }) {
  const [rutaIds, setRutaIds] = useState([]);
  const [transicion, setTransicion] = useState(null); // { direccion, sala, otroLado, puerta, ids }
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [llave, setLlave] = useState(null); // { destino, rango, ids, datos }: sala cerrada con llave
  const contRef = useRef(null); // dónde está la sala en la página (para que la animación encaje justo encima)

  function medirMarco() {
    const el = contRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width };
  }

  const ruta = useMemo(() => resolverRuta(data, rutaIds), [data, rutaIds]);
  const nodoActual = ruta[ruta.length - 1];

  // el aviso de "sala en obras" desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(''), 2200);
    return () => clearTimeout(id);
  }, [aviso]);

  // 🖼️ al entrar en una sala, prepara ya las salas a las que llevan sus puertas (y la de vuelta)
  useEffect(() => {
    (nodoActual.children || []).forEach((hijo) => prepararImagen(hijo.imagenFondo));
    if (ruta.length > 1) prepararImagen(ruta[ruta.length - 2].imagenFondo);
  }, [nodoActual, ruta]);

  function rendererDe(nodo) {
    if (!nodo) return null;
    return esHojaNodo(nodo) ? skin.leaf : (skin[nodo.vistaHijos] || skin.default);
  }

  // ▶️ cruza la puerta (al entrar o al salir) y después cambia de sala
  function cruzar(ids, datos) {
    if (!datos.puerta) {
      setRutaIds(ids); // sin puerta conocida: cambia sin animar
      return;
    }
    setOcupado(true);
    // la imagen del otro lado tiene que estar lista antes de abrir la puerta
    const clave = datos.direccion === 'entrar' ? datos.otroLado.imagenFondo : datos.sala.imagenFondo;
    esperarImagen(clave).then(() => setTransicion({ ...datos, ids, marco: medirMarco() }));
  }

  function alTerminarCruce() {
    setTransicion(null);
    setOcupado(false);
  }

  function irAHijo(childId) {
    if (ocupado) return;
    const atajo = (nodoActual.atajos || {})[childId];
    const idsDestino = atajo ? encontrarRutaCompleta(data, childId) : [...rutaIds, childId];

    // 🚧 puerta dibujada pero sin sala detrás todavía (p. ej. Título V): no se navega
    const existe = atajo ? !!idsDestino : (nodoActual.children || []).some((n) => n.id === childId);
    if (!existe) {
      setAviso('🚧 Esta sala todavía está en obras');
      return;
    }

    const rutaDestino = resolverRuta(data, idsDestino);
    const destino = rutaDestino[rutaDestino.length - 1];
    const datos = {
      direccion: 'entrar',
      sala: nodoActual,
      otroLado: destino,
      rutaSala: ruta,
      rutaOtro: rutaDestino,
      puerta: puertaDe(nodoActual, childId)
    };

    // 🔑 las salas (no los artículos) piden su llave una vez al día
    if (!esHojaNodo(destino) && !llavesDeHoy().includes(destino.id)) {
      const rango = rangoDe(destino);
      if (rango) {
        setLlave({ destino, rango, ids: idsDestino, datos });
        return;
      }
    }

    cruzar(idsDestino, datos);
  }

  function abrirConLlave() {
    const { destino, ids, datos } = llave;
    guardarLlave(destino.id);
    setLlave(null);
    cruzar(ids, datos);
  }

  function volver() {
    if (ocupado || rutaIds.length === 0) return;
    const idsDestino = rutaIds.slice(0, -1);
    const rutaPadre = resolverRuta(data, idsDestino);
    const padre = rutaPadre[rutaPadre.length - 1];
    cruzar(idsDestino, {
      direccion: 'salir',
      sala: padre,
      otroLado: nodoActual,
      rutaSala: rutaPadre,
      rutaOtro: ruta,
      puerta: puertaDe(padre, nodoActual.id)
    });
  }

  function irAId(idDestino) {
    if (ocupado) return;
    // un atajo con puerta dibujada en esta sala (p. ej. el Artículo 14): se cruza su puerta
    if ((nodoActual.atajos || {})[idDestino]) {
      irAHijo(idDestino);
      return;
    }
    const rutaCompleta = encontrarRutaCompleta(data, idDestino);
    if (rutaCompleta) setRutaIds(rutaCompleta);
  }

  function renderNodo(nodo, interactivo, rutaNodo) {
    const Renderer = rendererDe(nodo);
    if (!Renderer) return <div>Falta un renderer para "{nodo.vistaHijos}"</div>;
    return (
      <Renderer
        node={nodo}
        ruta={rutaNodo || ruta}
        onSelect={interactivo ? irAHijo : () => {}}
        onJump={interactivo ? irAId : () => {}}
        onBack={interactivo && rutaIds.length > 0 ? volver : null}
        getNodeState={getNodeState}
        onLeafAction={interactivo && esHojaNodo(nodo) ? () => onLeafAction(nodo) : null}
      />
    );
  }

  return (
    <div ref={contRef} style={{ position: 'relative', width: '100%' }}>
      {renderNodo(nodoActual, !transicion)}
      {transicion && (
        <PasoPuerta
          direccion={transicion.direccion}
          puerta={transicion.puerta}
          esArticulo={esHojaNodo(transicion.otroLado)}
          imagenPasillo={imagenesExplorador[transicion.sala.imagenFondo]}
          imagenInterior={esHojaNodo(transicion.otroLado) ? null : imagenesExplorador[transicion.otroLado.imagenFondo]}
          nivelPasillo={renderNodo(transicion.sala, false, transicion.rutaSala)}
          nivelInterior={esHojaNodo(transicion.otroLado) ? null : renderNodo(transicion.otroLado, false, transicion.rutaOtro)}
          marco={transicion.marco}
          medirMarco={medirMarco}
          alCambiar={() => setRutaIds(transicion.ids)}
          onComplete={alTerminarCruce}
        />
      )}
      {llave && (
        <LlaveSala sala={llave.destino} rango={llave.rango} onAbrir={abrirConLlave} onCerrar={() => setLlave(null)} />
      )}
      {aviso && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 28,
            transform: 'translateX(-50%)',
            background: '#fffaf2',
            border: '1px solid #eadfcd',
            borderRadius: 999,
            padding: '10px 18px',
            boxShadow: '0 4px 14px rgba(120,100,70,0.10)',
            color: '#5b4a3a',
            fontSize: 14,
            whiteSpace: 'nowrap',
            zIndex: 600
          }}
        >
          {aviso}
        </div>
      )}
    </div>
  );
}