import imagenesExplorador from '../../imagenesRegistry';

export default function SalaCapitulo({ node, onSelect, onBack, getNodeState }) {
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

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
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
                background: 'rgba(255,0,0,0.3)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}