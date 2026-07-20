export default function DetalleArticulo({ node, ruta, onBack, onLeafAction }) {
    const tieneContenido = node.contenido && !node.resumen?.startsWith('PENDIENTE');
  
    // La ruta incluye la raíz "constitucion" y el propio artículo; los del medio son las migas
    const migas = ruta.slice(1, -1);
  
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.85)', border: 'none',
                borderRadius: '50%', width: 40, height: 40, fontSize: 18,
                cursor: 'pointer', marginRight: 12,
              }}
            >
              ←
            </button>
          )}
          <h1 style={{ fontSize: 22, margin: 0 }}>{node.label}</h1>
        </div>
  
        <div
          style={{
            background: '#fdfaf5',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginBottom: 20,
          }}
        >
          {tieneContenido ? (
            <>
              <p style={{ fontWeight: 600, fontSize: 18, marginTop: 0 }}>{node.resumen}</p>
              <p style={{ lineHeight: 1.6, color: '#4a4038' }}>{node.contenido}</p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ fontSize: 15, color: '#8a7d6f', margin: 0 }}>
                🌱 Este artículo todavía está pendiente de completar.
              </p>
            </div>
          )}
        </div>
  
        {migas.length > 0 && (
          <div
            style={{
              background: '#f5f0e6',
              borderRadius: 20,
              padding: '16px 20px',
              marginBottom: 20,
            }}
          >
            <p style={{ fontWeight: 600, margin: '0 0 10px', fontSize: 14 }}>Pertenece a:</p>
            {migas.map((nodo, i) => (
              <div key={nodo.id} style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ color: '#a99b87', marginRight: 8 }}>{i > 0 ? '↳' : '›'}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{nodo.label}</p>
                  {nodo.subtitle && (
                    <p style={{ margin: 0, fontSize: 12, color: '#8a7d6f' }}>{nodo.subtitle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
  
        {onLeafAction && (
          <button
            onClick={onLeafAction}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #e8b88a, #e8a3ab)',
              color: '#5a3d2b',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Practicar este artículo
          </button>
        )}
      </div>
    );
  }