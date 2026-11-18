import { useState } from 'react';
import { styles } from '../estilos';

// 🔑 Llave diaria de las salas del Explorador.
// Una vez al día, para entrar en cada Título / Capítulo / Sección hay que decir
// de qué artículo a qué artículo va. Las llaves abiertas se guardan solo por hoy.

const CLAVE_LLAVES = 'opo_llaves_explorador_v1';
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function llavesDeHoy() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_LLAVES) || '{}');
    return datos.fecha === hoy() ? datos.abiertas || [] : [];
  } catch {
    return [];
  }
}

export function guardarLlave(id) {
  const abiertas = llavesDeHoy();
  if (!abiertas.includes(id)) abiertas.push(id);
  try {
    localStorage.setItem(CLAVE_LLAVES, JSON.stringify({ fecha: hoy(), abiertas }));
  } catch {
    /* sin almacenamiento: la llave vale solo para esta vez */
  }
}

const cssLlave = `
  .llave-entra { animation: llaveEntra 0.35s ease-out both; }
  @keyframes llaveEntra { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
  .llave-no { animation: llaveNo 0.45s ease-in-out; }
  @keyframes llaveNo {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); } 40% { transform: translateX(7px); }
    60% { transform: translateX(-5px); } 80% { transform: translateX(3px); }
  }
  .llave-gira { animation: llaveGira 0.6s cubic-bezier(0.3, 1.3, 0.5, 1) both; }
  @keyframes llaveGira { from { transform: rotate(0deg); } to { transform: rotate(90deg); } }
  .llave-input::-webkit-outer-spin-button, .llave-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .llave-input { -moz-appearance: textfield; }
  .llave-input:focus { outline: none; border-color: #c9b391; box-shadow: 0 0 0 3px rgba(201,179,145,0.18); }
`;

const estInput = {
  width: 74,
  fontSize: 22,
  textAlign: 'center',
  border: '1.5px solid #e6d9c4',
  borderRadius: 14,
  padding: '8px 6px',
  background: '#fff',
  color: '#4a463f',
  fontFamily: 'inherit'
};

export default function LlaveSala({ sala, rango, onAbrir, onCerrar }) {
  const unico = rango.desde === rango.hasta;
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [fallos, setFallos] = useState(0);
  const [abierta, setAbierta] = useState(false);
  const [vista, setVista] = useState(false); // ha pedido ver la respuesta

  const articulo = (sala.label || '').startsWith('Sección') ? 'de la' : 'del';

  function probar(e) {
    e.preventDefault();
    if (abierta) return;
    const ok = unico
      ? Number(desde) === rango.desde
      : Number(desde) === rango.desde && Number(hasta) === rango.hasta;
    if (ok) {
      setAbierta(true);
      setTimeout(onAbrir, 750);
    } else {
      setFallos((f) => f + 1);
    }
  }

  function verRespuesta() {
    setVista(true);
    setDesde(String(rango.desde));
    setHasta(String(rango.hasta));
  }

  let mensaje = '';
  if (abierta) mensaje = '¡Abierta! Pasa, pasa…';
  else if (vista) mensaje = unico ? `Guarda el artículo ${rango.desde}.` : `Va del ${rango.desde} al ${rango.hasta}. Mañana te la vuelvo a pedir.`;
  else if (fallos === 1) mensaje = 'Esa llave no encaja. Prueba otra vez.';
  else if (fallos >= 2) mensaje = `Una pista: empieza en el artículo ${rango.desde}.`;

  return (
    <div
      onClick={onCerrar}
      style={{
        position: 'fixed', inset: 0, zIndex: 650, background: 'rgba(80,64,48,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}
    >
      <style>{cssLlave}</style>
      <form
        key={fallos}
        onClick={(e) => e.stopPropagation()}
        onSubmit={probar}
        className={fallos ? 'llave-no' : 'llave-entra'}
        style={{
          background: '#fffaf2', borderRadius: 28, padding: '26px 22px 18px', width: '100%', maxWidth: 340,
          boxShadow: '0 10px 30px rgba(90,70,50,0.12)', textAlign: 'center', color: '#5b4a3a'
        }}
      >
        <div className={abierta ? 'llave-gira' : ''} style={{ fontSize: 40, lineHeight: 1, display: 'inline-block' }}>🔑</div>
        <h3 style={{ margin: '10px 0 4px', fontSize: 20, fontWeight: 600 }}>
          La llave {articulo} {sala.label}
        </h3>
        <p style={{ margin: '0 0 16px', color: '#8a7b68', fontSize: 15 }}>
          {unico ? '¿Qué artículo guarda?' : '¿De qué artículo a qué artículo va?'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          {!unico && <span>Del</span>}
          <input
            className="llave-input"
            type="number"
            inputMode="numeric"
            autoFocus
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            style={estInput}
            aria-label="Primer artículo"
          />
          {!unico && (
            <>
              <span>al</span>
              <input
                className="llave-input"
                type="number"
                inputMode="numeric"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                style={estInput}
                aria-label="Último artículo"
              />
            </>
          )}
        </div>

        <p style={{ minHeight: 20, margin: '0 0 12px', fontSize: 14, color: abierta ? '#6f8f6a' : '#b0705f' }}>{mensaje}</p>

        <button
          type="submit"
          disabled={!desde || (!unico && !hasta) || abierta}
          style={{ ...styles.ctaButton, width: '100%', margin: 0, opacity: !desde || (!unico && !hasta) ? 0.6 : 1 }}
        >
          Abrir la puerta
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 10 }}>
          {fallos >= 3 && !vista && !abierta && (
            <button type="button" onClick={verRespuesta} style={estEnlace}>Ver la respuesta</button>
          )}
          {!abierta && (
            <button type="button" onClick={onCerrar} style={estEnlace}>Ahora no</button>
          )}
        </div>
      </form>
    </div>
  );
}

const estEnlace = {
  background: 'none', border: 'none', color: '#8a7b68', fontSize: 14, cursor: 'pointer',
  fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3, padding: 4
};