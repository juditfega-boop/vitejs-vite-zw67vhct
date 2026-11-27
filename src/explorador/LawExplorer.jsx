import { useState, useMemo, useEffect, useRef } from 'react';
import PasoPuerta from './PasoPuerta';
import imagenesExplorador from './imagenesRegistry';
import PUERTAS from './data/puertas';
import LlaveSala, { llavesDeHoy, guardarLlave } from './LlaveSala';
import { marcarRacion } from '../servicios/progreso';

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

// 🚧 salas que todavía no tienen sus artículos: se abren con su llave y dentro se ve su estructura
// (no cuentan para la ración de Explora ni salen en Erre que erre ni en los juegos: no tienen artículos)
const SALAS_EN_OBRAS = {
  'titulo-2': { label: 'Título II', subtitle: 'De la Corona', desde: 56, hasta: 65, partes: [] },
  'titulo-3': {
    label: 'Título III',
    subtitle: 'De las Cortes Generales',
    desde: 66,
    hasta: 96,
    partes: [
      { label: 'Capítulo I', subtitle: 'De las Cámaras', desde: 66, hasta: 80 },
      { label: 'Capítulo II', subtitle: 'De la elaboración de las leyes', desde: 81, hasta: 92 },
      { label: 'Capítulo III', subtitle: 'De los Tratados Internacionales', desde: 93, hasta: 96 }
    ]
  },
  'titulo-4': { label: 'Título IV', subtitle: 'Del Gobierno y de la Administración', desde: 97, hasta: 107, partes: [] },
  'titulo-5': { label: 'Título V', subtitle: 'De las relaciones entre el Gobierno y las Cortes Generales', desde: 108, hasta: 116, partes: [] },
  'titulo-6': { label: 'Título VI', subtitle: 'Del Poder Judicial', desde: 117, hasta: 127, partes: [] },
  'titulo-7': { label: 'Título VII', subtitle: 'Economía y Hacienda', desde: 128, hasta: 136, partes: [] },
  'titulo-8': {
    label: 'Título VIII',
    subtitle: 'De la Organización Territorial del Estado',
    desde: 137,
    hasta: 158,
    partes: [
      { label: 'Capítulo I', subtitle: 'Principios generales', desde: 137, hasta: 139 },
      { label: 'Capítulo II', subtitle: 'De la Administración Local', desde: 140, hasta: 142 },
      { label: 'Capítulo III', subtitle: 'De las Comunidades Autónomas', desde: 143, hasta: 158 }
    ]
  },
  'titulo-9': { label: 'Título IX', subtitle: 'Del Tribunal Constitucional', desde: 159, hasta: 165, partes: [] },
  'titulo-10': { label: 'Título X', subtitle: 'De la reforma constitucional', desde: 166, hasta: 169, partes: [] }
};

// 🚧 dentro de una sala en obras: su nombre, sus artículos y lo que hay dentro
function SalaEnObras({ obra, onVolver }) {
  const tarjeta = {
    background: '#fdfaf4',
    borderRadius: 22,
    padding: '14px 16px',
    boxShadow: '0 3px 14px rgba(0,0,0,0.04)',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden'
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 640,
        overflowY: 'auto',
        background: '#f8f3ea',
        backgroundImage:
          'radial-gradient(circle at 12% 8%, rgba(233,185,182,0.22), rgba(233,185,182,0) 34%), radial-gradient(circle at 92% 30%, rgba(201,184,222,0.20), rgba(201,184,222,0) 32%)'
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 18px 40px', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif', color: '#4a463f' }}>
        <p style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: 40, lineHeight: 1, color: '#5b4a3a', margin: 0 }}>{obra.label}</p>
        <p style={{ fontSize: 14, color: '#5c5850', margin: '8px 0 16px', lineHeight: 1.4 }}>
          {obra.subtitle} · artículos {obra.desde} a {obra.hasta}
        </p>

        <div style={{ ...tarjeta, paddingTop: 30 }}>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: -20,
              right: -20,
              top: 0,
              height: 20,
              transform: 'rotate(-2deg)',
              background: 'repeating-linear-gradient(-45deg, #f2cb8f 0 18px, #6b5a48 18px 36px)',
              opacity: 0.8
            }}
          />
          <p style={{ margin: '6px 0 4px', fontWeight: 700, fontSize: 15 }}>🚧 Esta sala está en obras</p>
          <p style={{ margin: 0, fontSize: 13, color: '#5c5850', lineHeight: 1.45 }}>
            Todavía no puedes abrir sus artículos, pero ya sabes qué hay dentro y dónde empieza y acaba cada parte.
          </p>
        </div>

        <div style={tarjeta}>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#8a8578' }}>Lo que hay dentro</p>
          {obra.partes.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45 }}>
              Este Título no tiene capítulos: va directamente del artículo {obra.desde} al {obra.hasta}.
            </p>
          ) : (
            obra.partes.map((p, i) => (
              <div
                key={p.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: i < obra.partes.length - 1 ? '1px solid #f0e8db' : 'none',
                  fontSize: 13.5
                }}
              >
                <span>
                  <b>{p.label}</b> · {p.subtitle}
                </span>
                <span style={{ whiteSpace: 'nowrap', color: '#6e6256' }}>
                  {p.desde}–{p.hasta}
                </span>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onVolver}
          style={{
            display: 'block',
            width: '100%',
            border: 'none',
            borderRadius: 20,
            padding: 14,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'inherit',
            color: '#5b4a3a',
            background: '#f3ede3',
            cursor: 'pointer'
          }}
        >
          ‹ Volver
        </button>
      </div>
    </div>
  );
}

export default function LawExplorer({ data, skin, getNodeState, onLeafAction }) {
  const [rutaIds, setRutaIds] = useState([]);
  const [transicion, setTransicion] = useState(null); // { direccion, sala, otroLado, puerta, ids }
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [llave, setLlave] = useState(null); // { destino, rango, ids, datos }: sala cerrada con llave
  const [obra, setObra] = useState(null); // sala en obras abierta (sin artículos todavía)
  const contRef = useRef(null); // dónde está la sala en la página (para que la animación encaje justo encima)

  function medirMarco() {
    const el = contRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width };
  }

  const ruta = useMemo(() => resolverRuta(data, rutaIds), [data, rutaIds]);
  const nodoActual = ruta[ruta.length - 1];

  // 🍲 abrir un artículo cuenta para la tarea «Explora» de tu ración
  useEffect(() => {
    if (esHojaNodo(nodoActual)) marcarRacion('explora');
  }, [nodoActual]);

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
      // 🚧 sala en obras con su rango conocido: se abre con su llave, como las demás
      const enObras = SALAS_EN_OBRAS[childId];
      if (enObras) {
        if (llavesDeHoy().includes(childId)) setObra(enObras);
        else setLlave({ destino: { id: childId, label: enObras.label }, rango: { desde: enObras.desde, hasta: enObras.hasta }, obra: enObras });
        return;
      }
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
    if (llave.obra) {
      guardarLlave(llave.destino.id);
      setObra(llave.obra);
      setLlave(null);
      return;
    }
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
      {obra && <SalaEnObras obra={obra} onVolver={() => setObra(null)} />}
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