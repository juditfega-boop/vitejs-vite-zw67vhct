export default function PlaceholderNivel({ node, onSelect, onBack, onLeafAction }) {
    const esHoja = !node.children || node.children.length === 0;
  
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
        {onBack && (
          <button onClick={onBack} style={{ marginBottom: 20 }}>← Volver</button>
        )}
  
        <h2>{node.label}</h2>
        {node.subtitle && <p>{node.subtitle}</p>}
  
        {esHoja ? (
          <div>
            {node.resumen && <p><strong>{node.resumen}</strong></p>}
            {node.contenido && <p>{node.contenido}</p>}
            {onLeafAction && (
              <button onClick={onLeafAction} style={{ marginTop: 20 }}>
                Practicar este artículo
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {node.children.map((hijo) => (
              <button
                key={hijo.id}
                onClick={() => onSelect(hijo.id)}
                style={{ padding: 12, textAlign: 'left' }}
              >
                {hijo.label}{hijo.subtitle ? ` — ${hijo.subtitle}` : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }