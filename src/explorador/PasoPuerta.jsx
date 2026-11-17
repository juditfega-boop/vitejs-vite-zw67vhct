import { useEffect, useRef } from 'react';
import imagenDespacho from '../assets/kit/explorador/puerta-despacho.png';

// 🖼️ el despacho se prepara al cargar la app, para que nunca aparezca a medias
const precargaDespacho = new Image();
precargaDespacho.src = imagenDespacho;

const SUAVE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const ACELERA = 'cubic-bezier(0.5, 0, 0.75, 0.5)';
const BISAGRA = 'cubic-bezier(0.45, 0.05, 0.25, 1)';
const ANGULO = 78; // cuánto se abre cada hoja

const cssPaso = `
  .paso-andando { animation: pasoAndar 0.55s ease-in-out infinite; }
  @keyframes pasoAndar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  .paso-pulso { box-shadow: 0 0 0 3px rgba(255,236,200,0.9), 0 0 22px rgba(255,214,150,0.9); }
`;

const num = (v) => parseFloat(v);

// 🎥 cámara: lleva la puerta al centro de la pantalla y hace que ocupe "llenado" veces la pantalla
function camara(p, llenado, medidas) {
  if (!p || !llenado) return 'translate(0px, 0px) scale(1)';
  const { VW, VH, Wm, Hm, ox } = medidas;
  const dw = (num(p.width) / 100) * Wm, dh = (num(p.height) / 100) * Hm;
  const cx = ((num(p.left) + num(p.width) / 2) / 100) * Wm;
  const cy = ((num(p.top) + num(p.height) / 2) / 100) * Hm;
  const s = Math.max(1, llenado * Math.min(VW / dw, VH / dh));
  return `translate(${VW / 2 - ox - cx * s}px, ${VH / 2 - cy * s}px) scale(${s})`;
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 🚪 Cruzar una puerta del Explorador, en los dos sentidos.
 * - Puertas (simples o dobles): la cámara se acerca andando, las hojas giran sobre sus
 *   bisagras, sale luz del otro lado y se cruza el hueco.
 * - Arcos (sin puerta): se cruzan andando.
 * - Destino artículo: al otro lado está el despacho. Destino sala: la sala siguiente.
 * La vuelta reproduce lo mismo al revés: sales, la puerta se cierra y la cámara se aleja.
 */
export default function PasoPuerta({
  direccion, // 'entrar' | 'salir'
  puerta, // { tipo, bisagra, forma, left, top, width, height }
  esArticulo, // el otro lado de la puerta es un artículo (despacho) o una sala
  imagenPasillo, // imagen de la sala donde está la puerta (para recortar las hojas)
  imagenInterior, // lo que se ve al abrir la puerta (si es una sala)
  nivelPasillo,
  nivelInterior,
  onComplete
}) {
  const contRef = useRef(null);
  const andarRef = useRef(null);
  const mundoRef = useRef(null);
  const marcoRef = useRef(null);
  const luzRef = useRef(null);
  const hojasRef = useRef([]);
  const vinetaRef = useRef(null);
  const capaRef = useRef(null);
  const despachoRef = useRef(null);
  const veloRef = useRef(null);

  const conHojas = puerta.tipo === 'simple' || puerta.tipo === 'doble';
  const l = num(puerta.left), t = num(puerta.top), w = num(puerta.width), h = num(puerta.height);

  // hojas: trozos del propio dibujo, recortados justo encima de la puerta pintada
  const hojas = !conHojas
    ? []
    : puerta.tipo === 'doble'
    ? [
        { lado: 'izq', x: 0, ancho: 50, l, w: w / 2 },
        { lado: 'der', x: 50, ancho: 50, l: l + w / 2, w: w / 2 }
      ]
    : [{ lado: puerta.bisagra === 'izquierda' ? 'izq' : 'der', x: 0, ancho: 100, l, w }];

  useEffect(() => {
    let cancelado = false;
    const mundo = mundoRef.current;
    const pausa = (ms) => esperar(ms).then(() => { if (cancelado) throw new Error('cancelado'); });

    const medidas = {
      VW: contRef.current.clientWidth,
      VH: contRef.current.clientHeight,
      Wm: mundo.offsetWidth,
      Hm: mundo.offsetHeight,
      ox: andarRef.current.offsetLeft
    };
    const mover = (llenado, ms, curva = SUAVE) => {
      mundo.style.transition = ms ? `transform ${ms}ms ${curva}` : 'none';
      mundo.style.transform = camara(puerta, llenado, medidas);
    };
    const fundir = (el, valor, ms, curva = 'ease') => {
      if (!el) return;
      el.style.transition = `opacity ${ms}ms ${curva}`;
      el.style.opacity = valor;
    };
    const andar = (si) => andarRef.current && andarRef.current.classList.toggle('paso-andando', si);
    const girar = (abrir, ms) => {
      hojasRef.current.forEach((el, i) => {
        if (!el) return;
        const lado = hojas[i].lado;
        el.style.transition = ms ? `transform ${ms}ms ${BISAGRA}` : 'none';
        el.style.transform = abrir ? `rotateY(${lado === 'izq' ? ANGULO : -ANGULO}deg)` : 'rotateY(0deg)';
        const sombra = el.firstChild;
        if (sombra) fundir(sombra, abrir ? 1 : 0, ms || 1);
      });
      fundir(luzRef.current, abrir ? 0.9 : 0, ms || 1);
    };
    // la capa del otro lado: el despacho (artículo) o la sala siguiente
    const capa = () => (esArticulo ? despachoRef.current : capaRef.current);
    const mostrarCapa = (visible, escala, ms) => {
      const el = capa();
      if (!el) return;
      el.style.transition = ms ? `opacity ${ms}ms ease, transform ${Math.round(ms * 1.6)}ms ${SUAVE}` : 'none';
      el.style.opacity = visible ? 1 : 0;
      el.style.transform = `scale(${escala})`;
    };

    const llenadoCerca = conHojas ? 0.5 : 0.95;
    const llenadoDentro = conHojas ? 1.25 : 1.7;

    async function entrar() {
      if (marcoRef.current) marcoRef.current.classList.add('paso-pulso');
      await pausa(150);
      if (marcoRef.current) marcoRef.current.classList.remove('paso-pulso');

      // 1. caminar hasta la puerta
      andar(true);
      mover(llenadoCerca, 950);
      fundir(vinetaRef.current, 0.35, 950);
      await pausa(900);

      // 2. se abre (si tiene hojas)
      if (conHojas) {
        andar(false);
        girar(true, 1000);
        await pausa(820);
        andar(true);
      }

      // 3. cruzar el hueco
      mover(llenadoDentro, conHojas ? 750 : 650, ACELERA);
      fundir(vinetaRef.current, 0.65, 700);
      await pausa(conHojas ? 560 : 430);

      // 4. ya dentro: el otro lado ocupa la pantalla y se asienta
      mostrarCapa(false, esArticulo ? 1.12 : 1.22, 0);
      void mundo.offsetWidth;
      mostrarCapa(true, 1, 480);
      fundir(vinetaRef.current, 0, 600);
      await pausa(esArticulo ? 700 : 820);
      andar(false);

      // 5. a un artículo se llega con un fundido de luz
      if (esArticulo) {
        fundir(veloRef.current, 1, 320);
        await pausa(330);
      }
    }

    async function salir() {
      // se empieza ya dentro, con la puerta abierta detrás
      mover(llenadoDentro, 0);
      if (conHojas) girar(true, 0);
      mostrarCapa(true, 1, 0);
      if (vinetaRef.current) { vinetaRef.current.style.transition = 'none'; vinetaRef.current.style.opacity = 0.6; }
      if (esArticulo && veloRef.current) { veloRef.current.style.transition = 'none'; veloRef.current.style.opacity = 1; }
      void mundo.offsetWidth;

      if (esArticulo) {
        fundir(veloRef.current, 0, 300);
        await pausa(250);
      }

      // te alejas del otro lado y vuelves a ver el hueco
      andar(true);
      mostrarCapa(false, esArticulo ? 1.12 : 1.2, 450);
      await pausa(220);
      mover(llenadoCerca, 750);
      fundir(vinetaRef.current, 0.35, 750);
      await pausa(700);

      // la puerta se cierra detrás
      if (conHojas) {
        andar(false);
        girar(false, 850);
        await pausa(800);
        andar(true);
      }

      // y la cámara vuelve a la sala
      mover(0, 850);
      fundir(vinetaRef.current, 0, 850);
      await pausa(850);
      andar(false);
    }

    (direccion === 'entrar' ? entrar() : salir())
      .then(() => { if (!cancelado) onComplete(); })
      .catch(() => {});

    return () => { cancelado = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const radio = puerta.forma === 'recta' ? '3px' : '50% 50% 3px 3px / 24% 24% 3px 3px';

  return (
    <div ref={contRef} style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#f7f1e8', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' }}>
      <style>{cssPaso}</style>

      <div ref={andarRef} style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
        <div ref={mundoRef} style={{ position: 'relative', width: '100%', transformOrigin: '0 0', willChange: 'transform' }}>
          {nivelPasillo}

          {conHojas && (
            <>
              <div
                ref={luzRef}
                style={{
                  position: 'absolute', pointerEvents: 'none', opacity: 0, mixBlendMode: 'screen',
                  left: `${l - w * 0.9}%`, top: `${t - h * 0.35}%`, width: `${w * 2.8}%`, height: `${h * 1.7}%`,
                  background: 'radial-gradient(ellipse at center, rgba(255,226,165,0.95), rgba(255,226,165,0) 62%)'
                }}
              />
              <div
                ref={marcoRef}
                style={{
                  position: 'absolute', overflow: 'hidden', perspective: 650, borderRadius: radio,
                  left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`
                }}
              >
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${esArticulo ? imagenDespacho : imagenInterior})`,
                    backgroundSize: 'cover', backgroundPosition: '50% 42%'
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%, rgba(255,236,190,0.55), rgba(255,236,190,0) 70%)' }} />
                {hojas.map((hoja, i) => (
                  <div
                    key={i}
                    ref={(el) => (hojasRef.current[i] = el)}
                    style={{
                      position: 'absolute', top: 0, height: '100%', left: `${hoja.x}%`, width: `${hoja.ancho}%`,
                      backfaceVisibility: 'hidden', willChange: 'transform',
                      transformOrigin: hoja.lado === 'izq' ? 'left center' : 'right center',
                      backgroundImage: `url(${imagenPasillo})`,
                      backgroundSize: `${(100 / hoja.w) * 100}% ${(100 / h) * 100}%`,
                      backgroundPosition: `${(hoja.l / (100 - hoja.w)) * 100}% ${(t / (100 - h)) * 100}%`
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute', inset: 0, opacity: 0,
                        background: hoja.lado === 'izq'
                          ? 'linear-gradient(90deg, rgba(50,32,16,0.05), rgba(50,32,16,0.6))'
                          : 'linear-gradient(270deg, rgba(50,32,16,0.05), rgba(50,32,16,0.6))'
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* la viñeta oscurece los bordes de la pantalla al acercarse */}
      <div
        ref={vinetaRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(40,26,14,0.6) 100%)' }}
      />

      {esArticulo ? (
        <img
          ref={despachoRef}
          src={imagenDespacho}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, pointerEvents: 'none' }}
        />
      ) : (
        <div ref={capaRef} style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', opacity: 0, pointerEvents: 'none', background: '#f7f1e8' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>{nivelInterior}</div>
        </div>
      )}

      <div ref={veloRef} style={{ position: 'absolute', inset: 0, background: '#fffaf2', opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}