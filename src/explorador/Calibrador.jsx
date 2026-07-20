import { useState, useRef } from 'react';

export default function Calibrador({ imagenSrc }) {
  const [rects, setRects] = useState([]);
  const [dibujando, setDibujando] = useState(null);
  const contenedorRef = useRef(null);

  function porcentaje(clientX, clientY) {
    const box = contenedorRef.current.getBoundingClientRect();
    return {
      x: ((clientX - box.left) / box.width) * 100,
      y: ((clientY - box.top) / box.height) * 100,
    };
  }

  function empezar(e) {
    const p = porcentaje(e.clientX, e.clientY);
    setDibujando({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  }

  function mover(e) {
    if (!dibujando) return;
    const p = porcentaje(e.clientX, e.clientY);
    setDibujando((d) => ({ ...d, x2: p.x, y2: p.y }));
  }

  function terminar() {
    if (!dibujando) return;
    const id = window.prompt('¿Qué id tiene esta puerta? (ej: articulo-11)');
    if (id) {
      const left = Math.min(dibujando.x1, dibujando.x2);
      const top = Math.min(dibujando.y1, dibujando.y2);
      const width = Math.abs(dibujando.x2 - dibujando.x1);
      const height = Math.abs(dibujando.y2 - dibujando.y1);
      setRects((prev) => [
        ...prev,
        { id, top: top.toFixed(1) + '%', left: left.toFixed(1) + '%', width: width.toFixed(1) + '%', height: height.toFixed(1) + '%' },
      ]);
    }
    setDibujando(null);
  }

  function borrarUltimo() {
    setRects((prev) => prev.slice(0, -1));
  }

  const json = JSON.stringify(
    Object.fromEntries(rects.map(({ id, ...rest }) => [id, rest])),
    null,
    2
  );

  return (
    <div style={{ padding: 20 }}>
      <p>Arrastra un rectángulo sobre cada puerta. Al soltar, te pedirá el id.</p>
      <button onClick={borrarUltimo} style={{ marginBottom: 10 }}>Borrar último rectángulo</button>

      <div
        ref={contenedorRef}
        onMouseDown={empezar}
        onMouseMove={mover}
        onMouseUp={terminar}
        style={{ position: 'relative', width: '100%', cursor: 'crosshair', userSelect: 'none' }}
      >
        <img src={imagenSrc} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} draggable={false} />

        {rects.map((r) => (
          <div key={r.id} style={{
            position: 'absolute', top: r.top, left: r.left, width: r.width, height: r.height,
            background: 'rgba(0,150,255,0.3)', border: '2px solid rgba(0,100,255,0.8)',
          }}>
            <span style={{ fontSize: 10, background: 'white', padding: '0 2px' }}>{r.id}</span>
          </div>
        ))}

        {dibujando && (
          <div style={{
            position: 'absolute',
            top: Math.min(dibujando.y1, dibujando.y2) + '%',
            left: Math.min(dibujando.x1, dibujando.x2) + '%',
            width: Math.abs(dibujando.x2 - dibujando.x1) + '%',
            height: Math.abs(dibujando.y2 - dibujando.y1) + '%',
            background: 'rgba(255,0,0,0.3)', border: '2px dashed red',
          }} />
        )}
      </div>

      <h3 style={{ marginTop: 20 }}>JSON generado (copia esto):</h3>
      <textarea readOnly value={json} style={{ width: '100%', height: 200, fontFamily: 'monospace' }} />
    </div>
  );
}