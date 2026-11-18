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

// 🎥 cámara: lleva la puerta al centro de la pantalla y hace que ocupe "llenado" veces la pantalla.
// x, y = dónde está la sala en la pantalla (el mismo sitio que ocupa en la página)
function camara(p, llenado, m) {
  if (!p || !llenado) return 'translate(0px, 0px) scale(1)';
  const { VW, VH, Wm, Hm, x, y } = m;
  const dw = (num(p.width) / 100) * Wm, dh = (num(p.height) / 100) * Hm;
  const cx = ((num(p.left) + num(p.width) / 2) / 100) * Wm;
  const cy = ((num(p.top) + num(p.height) / 2) / 100) * Hm;
  const s = Math.max(1, llenado * Math.min(VW / dw, VH / dh));
  return `translate(${VW / 2 - x - cx * s}px, ${VH / 2 - y - cy * s}px) scale(${s})`;
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const fotograma = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/**
 * 🚪 Cruzar una puerta del Explorador, en los dos sentidos.
 * La animación empieza y termina EXACTAMENTE donde está la sala en la página
 * (mismo sitio, mismo tamaño), así que no hay saltos al entrar ni al salir:
 * - al empezar, el fondo de la pantalla se funde poco a poco mientras la cámara se acerca;
 * - a mitad, se cambia la sala de la página por debajo (alCambiar), sin que se vea;
 * - al terminar, todo se funde suavemente con la página ya cambiada.
 */
export default function PasoPuerta({
  direccion, // 'entrar' | 'salir'
  puerta, // { tipo, bisagra, forma, left, top, width, height }
  esArticulo, // el otro lado de la puerta es un artículo (despacho) o una sala
  imagenPasillo, // imagen de la sala donde está la puerta (para recortar las hojas)
  imagenInterior, // lo que se ve al abrir la puerta (si es una sala)
  nivelPasillo,
  nivelInterior,
  marco, // { top, left, width }: dónde está la sala en la pantalla al empezar
  medirMarco, // vuelve a medir dónde está la sala en la página
  alCambiar, // cambia la sala de la página (por debajo, sin que se vea)
  onComplete
}) {
  const contRef = useRef(null);
  const fondoRef = useRef(null);
  const sitioRef = useRef(null);
  const pasoRef = useRef(null);
  const mundoRef = useRef(null);
  const huecoRef = useRef(null);
  const luzRef = useRef(null);
  const hojasRef = useRef([]);
  const vinetaRef = useRef(null);
  const capaRef = useRef(null);
  const despachoRef = useRef(null);
  const veloRef = useRef(null);

  const conHojas = puerta.tipo === 'simple' || puerta.tipo === 'doble';
  const l = num(puerta.left), t = num(puerta.top), w = num(puerta.width), h = num(puerta.height);
  const sitio = marco || { top: 0, left: 0, width: Math.min(window.innerWidth, 560) };

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

    const llenadoCerca = conHojas ? 0.5 : 0.95;
    const llenadoDentro = conHojas ? 1.25 : 1.7;

    const medidas = {
      VW: contRef.current.clientWidth,
      VH: contRef.current.clientHeight,
      Wm: mundo.offsetWidth,
      Hm: mundo.offsetHeight,
      x: sitio.left,
      y: sitio.top
    };
    let llenadoActual = 0;
    const mover = (llenado, ms, curva = SUAVE) => {
      llenadoActual = llenado;
      mundo.style.transition = ms ? `transform ${ms}ms ${curva}` : 'none';
      mundo.style.transform = camara(puerta, llenado, medidas);
    };
    const fundir = (el, valor, ms, curva = 'ease') => {
      if (!el) return;
      el.style.transition = `opacity ${ms}ms ${curva}`;
      el.style.opacity = valor;
    };
    const fijar = (el, valor) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity = valor;
    };
    // andar: un balanceo suave; al pararse vuelve a su sitio poco a poco (sin saltito)
    const andar = (si) => {
      const el = pasoRef.current;
      if (!el) return;
      if (si) {
        el.style.transition = 'none';
        el.style.transform = '';
        el.classList.add('paso-andando');
        return;
      }
      if (!el.classList.contains('paso-andando')) return;
      const actual = getComputedStyle(el).transform;
      el.classList.remove('paso-andando');
      el.style.transition = 'none';
      el.style.transform = actual === 'none' ? 'translateY(0px)' : actual;
      void el.offsetWidth;
      el.style.transition = 'transform 260ms ease-out';
      el.style.transform = 'translateY(0px)';
    };
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
    // recoloca la animación en el sitio exacto donde está ahora la sala en la página
    const colocar = (r) => {
      [sitioRef.current, capaRef.current].forEach((el) => {
        if (!el) return;
        el.style.left = `${r.left}px`;
        el.style.top = `${r.top}px`;
        el.style.width = `${r.width}px`;
      });
      medidas.x = r.left;
      medidas.y = r.top;
      medidas.Wm = mundo.offsetWidth;
      medidas.Hm = mundo.offsetHeight;
      mover(llenadoActual, 0);
    };
    // cambia la sala de la página por debajo (tapada) y vuelve a medir su sitio
    async function cambiarDeSala() {
      alCambiar();
      await fotograma();
      if (cancelado) throw new Error('cancelado');
      const r = medirMarco && medirMarco();
      if (r) colocar(r);
    }

    async function entrar() {
      if (huecoRef.current) huecoRef.current.classList.add('paso-pulso');
      await pausa(150);
      if (huecoRef.current) huecoRef.current.classList.remove('paso-pulso');

      // 1. caminar hasta la puerta (lo de alrededor se va fundiendo)
      andar(true);
      mover(llenadoCerca, 950);
      fundir(fondoRef.current, 1, 700);
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

      // 4. ya dentro: el otro lado ocupa su sitio y se asienta
      mostrarCapa(false, esArticulo ? 1.12 : 1.22, 0);
      void mundo.offsetWidth;
      mostrarCapa(true, 1, 480);
      if (!esArticulo) fundir(sitioRef.current, 0, 480);
      fundir(vinetaRef.current, 0, 600);
      await pausa(esArticulo ? 700 : 820);
      andar(false);

      // 5. a un artículo se llega con un fundido de luz
      if (esArticulo) {
        fundir(veloRef.current, 1, 320);
        await pausa(330);
      }

      // 6. la página cambia por debajo y la animación se funde con ella
      await cambiarDeSala();
      fundir(contRef.current, 0, esArticulo ? 420 : 280);
      await pausa(esArticulo ? 420 : 280);
    }

    async function salir() {
      // se empieza viendo la página tal cual; la puerta abierta espera detrás
      mover(llenadoDentro, 0);
      if (conHojas) girar(true, 0);

      if (esArticulo) {
        fundir(veloRef.current, 1, 300);
        await pausa(300);
        fijar(fondoRef.current, 1);
        fijar(sitioRef.current, 1);
        fijar(vinetaRef.current, 0.6);
        mostrarCapa(true, 1, 0);
      } else {
        mostrarCapa(true, 1, 0);
        void mundo.offsetWidth;
        fundir(fondoRef.current, 1, 300);
        fundir(sitioRef.current, 1, 300);
        fundir(vinetaRef.current, 0.6, 300);
        await pausa(300);
      }

      // por debajo, la página ya pasa a la sala de fuera
      await cambiarDeSala();

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

      // la cámara vuelve a la sala y lo de alrededor reaparece
      mover(0, 850);
      fundir(vinetaRef.current, 0, 850);
      await pausa(350);
      andar(false);
      fundir(fondoRef.current, 0, 500);
      await pausa(520);
    }

    (direccion === 'entrar' ? entrar() : salir())
      .then(() => { if (!cancelado) onComplete(); })
      .catch(() => {});

    return () => { cancelado = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const radio = puerta.forma === 'recta' ? '3px' : '50% 50% 3px 3px / 24% 24% 3px 3px';

  return (
    <div ref={contRef} style={{ position: 'fixed', inset: 0, zIndex: 500, overflow: 'hidden' }}>
      <style>{cssPaso}</style>

      {/* el fondo aparece poco a poco: al empezar se sigue viendo la página */}
      <div ref={fondoRef} style={{ position: 'absolute', inset: 0, background: '#f7f1e8', opacity: 0 }} />

      <div
        ref={sitioRef}
        style={{
          position: 'absolute', top: sitio.top, left: sitio.left, width: sitio.width,
          opacity: direccion === 'salir' ? 0 : 1
        }}
      >
        <div ref={pasoRef}>
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
                  ref={huecoRef}
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
        // la sala del otro lado, en el mismo sitio exacto que ocupará en la página
        <div
          ref={capaRef}
          style={{ position: 'absolute', top: sitio.top, left: sitio.left, width: sitio.width, opacity: 0, pointerEvents: 'none' }}
        >
          {nivelInterior}
        </div>
      )}

      <div ref={veloRef} style={{ position: 'absolute', inset: 0, background: '#fffaf2', opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}