import imagenesExplorador from '../../imagenesRegistry';

export default function SalaCapitulo({ node, onSelect, onJump, onBack, getNodeState }) {
  const imagenFondo = node.imagenFondo ? imagenesExplorador[node.imagenFondo] : null;

  if (!imagenFondo) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 20, textAlign: 'center' }}>
        {onBack && (
          <button onClick={onBack} style={{ marginBottom: 20 }}>← Volver</button>
        )}
        <h2>{node.label}</h2>
        <p>🚧 Esta sección todavía está en construcción.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {node.children.map((hijo) => (
            <button key={hijo.id} onClick={() => onSelect(hijo.id)} style={{ padding: 12 }}>
              {hijo.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const puertas = node.hotspots || {};
  const atajos = node.atajos || {};

  return (
<div style={{ position: 'relative', width: '100%' }}>
      {onBack && (
        <button onClick={onBack} style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10,
          background: 'rgba(255,255,255,0.85)', border: 'none',
          borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer'
        }}>
          ←
        </button>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src={imagenFondo}
          alt={node.label}
          style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }}
        />

{Object.entries(puertas).map(([id, puerta]) => {
          const estado = getNodeState ? getNodeState(id) : null;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={id}
              style={{
                position: 'absolute',
                top: puerta.top,
                left: puerta.left,
                width: puerta.width,
                height: puerta.height,
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            />
          );
        })}

{Object.entries(atajos).map(([id, puerta]) => (
          <button
            key={id}
            onClick={() => onJump(id)}
            title={`atajo: ${id}`}
            style={{
              position: 'absolute',
              top: puerta.top,
              left: puerta.left,
              width: puerta.width,
              height: puerta.height,
              background: 'transparent',
              border: 'none',
              borderRadius: puerta.etiqueta ? '50%' : '8px',
              // ✨ los atajos con etiqueta (p. ej. el Art. 10 del frontón) llevan un brillo suave
              boxShadow: puerta.etiqueta
                ? '0 0 0 3px rgba(232,184,138,0.55), 0 0 14px 4px rgba(232,184,138,0.45)'
                : 'none',
              cursor: 'pointer',
            }}
          />
        ))}

        {/* 🏷️ la etiqueta del atajo, justo debajo de su zona (también se puede pulsar) */}
        {Object.entries(atajos)
          .filter(([, puerta]) => puerta.etiqueta)
          .map(([id, puerta]) => (
            <button
              key={`etiqueta-${id}`}
              onClick={() => onJump(id)}
              style={{
                position: 'absolute',
                top: `calc(${puerta.top} + ${puerta.height})`,
                left: `calc(${puerta.left} + ${puerta.width} / 2)`,
                transform: 'translate(-50%, -20%)',
                background: '#fdfaf4',
                border: '1.2px solid #6b5640',
                borderRadius: 999,
                padding: '2px 10px',
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                fontWeight: 'bold',
                color: '#4a3b2e',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(90,61,43,0.18)',
                cursor: 'pointer',
              }}
            >
              {puerta.etiqueta}
            </button>
          ))}
      </div>
    </div>
  );
}