// 🎨 Estilos de Asistontas Sociales
//
// Este archivo contiene TODO lo visual de la app: la hoja de estilos
// global (animaciones CSS como el confeti o la vibración de error) y el
// objeto 'styles' con los estilos inline de cada elemento.
//
// No contiene ninguna lógica de la app -- solo colores, tamaños, márgenes
// y animaciones. Se puede editar con tranquilidad sin miedo a romper
// ninguna pantalla ni ningún minijuego.

const globalStyles = `
  .menu-btn, .pill, .bloque-chip {
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  }
  .menu-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.12);
  }
  .menu-btn:active {
    transform: translateY(0) scale(0.98);
  }
  .bloque-chip:hover {
    background: #efe8da;
    transform: translateY(-1px);
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 46px;
    height: 26px;
    flex-shrink: 0;
  }
  .switch input { display: none; }
  .switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #e4ddcf;
    transition: 0.2s;
    border-radius: 26px;
  }
  .switch .slider:before {
    position: absolute;
    content: "";
    height: 20px; width: 20px;
    left: 3px; bottom: 3px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .switch input:checked + .slider {
    background-color: #e29aa0;
  }
  .switch input:checked + .slider:before {
    transform: translateX(20px);
  }
  @keyframes caerConfeti {
    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) rotate(360deg); opacity: 0.9; }
  }
  .confeti-pieza {
    position: fixed;
    top: 0;
    width: 8px;
    height: 14px;
    animation-name: caerConfeti;
    animation-timing-function: ease-in;
    animation-fill-mode: forwards;
    pointer-events: none;
    z-index: 999;
  }
  @keyframes archivosVibrar {
    10%, 90% { transform: translateX(-2px); }
    20%, 80% { transform: translateX(4px); }
    30%, 50%, 70% { transform: translateX(-6px); }
    40%, 60% { transform: translateX(6px); }
  }
  .archivos-shake {
    animation: archivosVibrar 0.4s;
  }
`;

const styles = {
  container: {
    maxWidth: 700,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial",
    textAlign: "center"
  },
  button: {
    display: "block",
    width: "100%",
    padding: "14px 16px",
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid #e8e2d4",
    background: "#fff",
    color: "#4a463f",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
  },
  explicacionCaja: {
    background: "#faf3e8",
    border: "1px dashed #e4ddcf",
    borderRadius: 18,
    padding: "16px 18px",
    marginTop: 14,
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: "left",
    color: "#4a463f"
  },
  explicacionTituloRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  explicacionIcono: {
    width: 20,
    height: 20,
    objectFit: "contain",
    flexShrink: 0
  },

// 🌱 pantalla de Estudiar — quiz en una sola pantalla
quizHeaderRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18
},
quizVolverBtn: {
  border: "none",
  background: "transparent",
  color: "#8a8578",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0
},
quizFavoritoBtn: {
  border: "none",
  background: "transparent",
  fontSize: 22,
  cursor: "pointer",
  lineHeight: 1,
  padding: 0
},
quizPreguntaTag: {
  display: "inline-block",
  background: "#faf3e8",
  border: "1px dashed #e4ddcf",
  borderRadius: 10,
  padding: "6px 16px",
  fontSize: 13,
  color: "#8a8578",
  fontWeight: 600,
  marginBottom: 16
},
quizPreguntaCard: {
  background: "#fff",
  borderRadius: 24,
  padding: "22px 20px",
  marginBottom: 18,
  boxShadow: "0 3px 12px rgba(0,0,0,0.035)",
  textAlign: "left"
},
quizPreguntaTexto: {
  fontSize: 17,
  fontWeight: 700,
  color: "#4a463f",
  margin: 0,
  lineHeight: 1.45
},
quizRespuestaBtn: {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  textAlign: "left",
  border: "1px solid #e8e2d4",
  background: "#fff",
  borderRadius: 18,
  padding: "14px 16px",
  marginBottom: 10,
  fontSize: 14,
  color: "#4a463f",
  cursor: "pointer",
  lineHeight: 1.5,
  whiteSpace: "pre-line",
  fontFamily: "Arial"
},
quizRespuestaLetra: {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#faf7f2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  color: "#8a8578",
  flexShrink: 0
},
quizRespuestaCorrecta: {
  borderColor: "#a8c9ae",
  background: "#eaf4ec"
},
quizRespuestaIncorrecta: {
  borderColor: "#e2a3a3",
  background: "#faeaea"
},
quizFeedbackRow: {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 4,
  marginBottom: 4
},
quizFeedbackIcono: {
  width: 34,
  height: 34,
  objectFit: "contain"
},
quizFeedbackTexto: {
  fontSize: 14,
  fontWeight: 700,
  color: "#4a463f",
  margin: 0
},

// 🌸 estilos de la portada
  landingContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    margin: 0,
    overflow: "hidden",
    background: "#f5f1ea"
  },
  landingImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block"
  },
  landingOverlay: {
    position: "absolute",
    bottom: "6%",
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 24px",
    boxSizing: "border-box"
  },
  landingFrase: {
    fontFamily: "Arial",
    fontStyle: "italic",
    color: "#5a5147",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
    maxWidth: 320
  },
  landingButton: {
    padding: "16px 42px",
    borderRadius: 30,
    border: "none",
    background: "#e29aa0",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.18)"
  },

  // 🟣 contenedor general estilo "app"
  menuContainer: {
    maxWidth: 480,
    margin: "0 auto",
    minHeight: "100vh",
    padding: "40px 20px 60px",
    fontFamily: "Arial",
    background: "linear-gradient(180deg, #faf7f2 0%, #f2ece0 100%)",
    boxSizing: "border-box"
  },
  muerteJugandoContainer: {
    maxWidth: 960,
    margin: "0 auto",
    minHeight: "100vh",
    padding: "40px 12px 60px 4px",
    fontFamily: "Arial",
    background: "linear-gradient(180deg, #faf7f2 0%, #f2ece0 100%)",
    boxSizing: "border-box"
  },
  menuHeader: {
    textAlign: "center",
    marginBottom: 28
  },
  menuTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#4a463f",
    margin: 0,
    letterSpacing: 0.5
  },
  menuUnderline: {
    width: 70,
    height: 4,
    borderRadius: 4,
    background: "linear-gradient(90deg, #cbb8e8, #e29aa0)",
    margin: "10px auto 0"
  },
  menuButton: {
    display: "block",
    width: "100%",
    border: "none",
    borderRadius: 18,
    padding: "16px 18px",
    marginBottom: 14,
    fontSize: 15,
    fontWeight: 600,
    color: "#4a463f",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  btnPeach: { background: "#f6d7ae" },
  btnPurple: { background: "#d9cdf0" },
  btnPink: { background: "#f3cdd2" },
  btnOlive: { background: "#d7dcc0" },
  btnMint: { background: "#c9e4d0" },
  btnMuted: { background: "#efece4", color: "#a39d8e" },
  badgeProximamente: {
    float: "right",
    fontSize: 10,
    fontWeight: 700,
    background: "#fff",
    color: "#a39d8e",
    padding: "3px 8px",
    borderRadius: 10
  },
  linkVolver: {
    display: "block",
    width: "100%",
    textAlign: "center",
    border: "none",
    background: "transparent",
    color: "#8a8578",
    fontSize: 13,
    padding: 12,
    marginTop: 6,
    cursor: "pointer"
  },

  // ⚙️ tarjetas de configuración
  configCard: {
    background: "#fff",
    borderRadius: 22,
    padding: "20px 22px",
    marginBottom: 20,
    boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
  },
  configCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#4a463f",
    marginBottom: 12
  },
  configCardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  configCardIcono: {
    width: 26,
    height: 26,
    objectFit: "contain",
    flexShrink: 0
  },
  estudiarHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  estudiarHeaderIcono: {
    width: 46,
    height: 46,
    objectFit: "contain"
  },
  configRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  configSubLabel: {
    fontSize: 13,
    color: "#8a8578"
  },
  numeroInput: {
    border: "1px solid #e4ddcf",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    width: 80
  },
  nombreInput: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e4ddcf",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 8
  },

  // 🔘 pills genéricas reutilizables
  pillGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    background: "#faf7f2",
    padding: 4,
    borderRadius: 20
  },
  pillBtn: {
    border: "none",
    background: "transparent",
    padding: "8px 16px",
    borderRadius: 16,
    fontSize: 13,
    color: "#8a8578",
    cursor: "pointer"
  },
  pillBtnActiva: {
    background: "#e29aa0",
    color: "#fff",
    fontWeight: 700
  },

  bloquesTitle: {
    fontSize: 13,
    color: "#8a8578",
    margin: "22px 0 10px",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  bloquesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14
  },
  bloqueChip: {
    border: "1px solid #e4ddcf",
    background: "#fff",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    color: "#4a463f",
    cursor: "pointer"
  },
  bloqueChipActiva: {
    background: "#e29aa0",
    color: "#fff",
    borderColor: "#e29aa0"
  },

  // 🎯 botón grande de acción principal
  ctaButton: {
    display: "block",
    width: "100%",
    border: "none",
    borderRadius: 22,
    padding: "18px 22px",
    marginTop: 12,
    fontSize: 16,
    fontWeight: 700,
    color: "#5a4636",
    background: "linear-gradient(135deg, #f2cb8f, #eeb9bd)",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    textAlign: "center"
  },
  ctaButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    boxShadow: "none"
  },

  // 📊 tarjetas de estadísticas
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 20
  },
  statCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 16,
    textAlign: "center",
    boxShadow: "0 3px 10px rgba(0,0,0,0.03)"
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#4a463f"
  },
  statLabel: {
    fontSize: 11,
    color: "#8a8578",
    marginTop: 4
  },

  // 📝 simulacro
  simHeaderBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8
  },
  simTimer: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e29aa0",
    background: "#fff",
    padding: "6px 14px",
    borderRadius: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  },
  simFinalizarBtn: {
    border: "none",
    background: "#f3cdd2",
    color: "#4a463f",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer"
  },
  simDotsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    maxHeight: 110,
    overflowY: "auto",
    marginBottom: 18,
    padding: 8,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  simDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1px solid #e4ddcf",
    background: "#fff",
    fontSize: 11,
    color: "#8a8578",
    cursor: "pointer"
  },
  simDotRespondida: {
    background: "#d7dcc0",
    borderColor: "#d7dcc0",
    color: "#4a463f"
  },
  simDotActual: {
    border: "2px solid #e29aa0"
  },
  simRespuestaBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    marginBottom: 10,
    borderRadius: 14,
    border: "1px solid #e4ddcf",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14
  },
  simRespuestaSeleccionada: {
    background: "#d9cdf0",
    borderColor: "#a992d9"
  },
  simNavRow: {
    display: "flex",
    gap: 10,
    marginTop: 16
  },
  simNavBtn: {
    flex: 1,
    border: "none",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    color: "#4a463f"
  },

  // 🏁 resultados
resultCard: {
    background: "#fff",
    borderRadius: 22,
    padding: 22,
    marginTop: 6,
    boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f0ece2",
    fontSize: 14
  },
  resultRowLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#4a463f",
    fontWeight: 600
  },
  resultRowIcono: {
    width: 22,
    height: 22,
    objectFit: "contain",
    flexShrink: 0
  },
  resultRowValor: {
    fontWeight: 700,
    color: "#4a463f"
  },
  finBloqueHeroImg: {
    display: "block",
    width: 190,
    margin: "0 auto 14px"
  },
  finBloqueSubtitulo: {
    textAlign: "center",
    color: "#8a8578",
    fontSize: 14,
    marginTop: -6,
    marginBottom: 6
  },
  finBloqueCorazon: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 14
  },

  // 🎬 vídeo de celebración
  videoContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    margin: 0,
    overflow: "hidden",
    background: "#faf7f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  videoElement: {
    maxWidth: "100%",
    maxHeight: "100%",
    display: "block"
  },
  skipButton: {
    position: "absolute",
    top: 20,
    right: 20,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    color: "#4a463f",
    padding: "8px 16px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  borrarPartidaBtn: {
    border: "none",
    background: "transparent",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1
  },

// 🎬 vídeo fusionado dentro de la pantalla de resultado
videoResultadoWrap: {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: 20,
  overflow: "hidden",
  marginBottom: 18,
  background: "#faf7f2",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
},
videoElementInline: {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "top",
  display: "block"
},
etiquetaNombreVideo: {
  position: "absolute",
  transform: "translateY(-100%)",
  background: "#fff",
  color: "#4a463f",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  whiteSpace: "nowrap",
  pointerEvents: "none"
},

  // 🥇 fila de jugadora desplegable con sus fallos
  filaJugadoraBtn: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    border: "none",
    background: "transparent",
    padding: "10px 0",
    borderBottom: "1px solid #f0ece2",
    fontSize: 14,
    cursor: "pointer",
    color: "#4a463f",
    fontFamily: "Arial"
  },
  fallosWrap: {
    padding: "8px 4px 14px",
    borderBottom: "1px solid #f0ece2"
  },
  falloItem: {
    background: "#faf7f2",
    borderRadius: 10,
    padding: "10px 12px",
    marginBottom: 8,
    fontSize: 13,
    textAlign: "left"
  },

// ☠️ layout de "Salva a tu trabajadora social" (pregunta arriba, imagen fija a la izquierda, respuestas a la derecha)
muertePreguntaTitulo: {
  textAlign: "center",
  marginBottom: 14
},
muerteLayout: {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  gap: 6
},
muerteImagenCol: {
  flex: "0 0 30%",
  background: "transparent",
  boxShadow: "none",
  borderRadius: 0
},
muerteImagen: {
  width: "100%",
  height: "auto",
  display: "block",
  transform: "scale(2.3)",
  transformOrigin: "top center"
},
muertePreguntaCol: {
  flex: 1,
  minWidth: 0
},

  // 🎮 fila de minijuego con miniatura, en el hub de Minijuegos
  filaMinijuegoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    border: "none",
    background: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    textAlign: "left",
    fontFamily: "Arial"
  },
  miniaturaMinijuego: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: "cover",
    flexShrink: 0
  },
  filaMinijuegoTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: 600,
    color: "#4a463f"
  },
  miniaturaMinijuegoEmoji: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: "#f2ece0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    flexShrink: 0
  },

  // 🎲 hub de Minijuegos (rediseño)
  minijuegosSubtitulo: {
    textAlign: "center",
    color: "#8a8578",
    fontSize: 13,
    lineHeight: 1.6,
    margin: "-10px 0 24px",
    padding: "0 10px"
  },
  minijuegoFilaCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    border: "none",
    background: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
    textAlign: "left",
    fontFamily: "Arial"
  },
  minijuegoFilaImg: {
    width: 64,
    height: 64,
    objectFit: "contain",
    flexShrink: 0
  },
  minijuegoFilaTexto: {
    flex: 1,
    minWidth: 0
  },
  minijuegoFilaTitulo: {
    fontSize: 15,
    fontWeight: 700,
    color: "#4a463f",
    margin: "0 0 4px"
  },
  minijuegoFilaDescripcion: {
    fontSize: 12,
    color: "#8a8578",
    margin: 0,
    lineHeight: 1.45
  },
  minijuegoFilaFlecha: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    color: "#4a463f",
    flexShrink: 0
  },

  // 🎮 portada/detalle de un minijuego (patrón reutilizable para los 4 juegos)
  juegoDetalleHeroImg: {
    display: "block",
    width: "100%",
    borderRadius: 24,
    marginBottom: 20,
    boxShadow: "0 4px 14px rgba(0,0,0,0.05)"
  },
  juegoDetalleFila: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 4px",
    borderBottom: "1px solid #f0ece2"
  },
  juegoDetalleEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: "center",
    flexShrink: 0
  },
  juegoDetalleTexto: {
    margin: 0,
    fontSize: 13,
    color: "#4a463f",
    lineHeight: 1.5
  },
  juegoDetalleEmojiTitulo: {
    fontSize: 26,
    display: "block",
    textAlign: "center",
    marginBottom: 4
  },

  // 📁 layout del juego de emparejar "Conecta la Constitución"
  archivosColumnas: {
    display: "flex",
    gap: 10
  },
  archivosColumna: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  archivosTarjeta: {
    border: "1px solid #e4ddcf",
    background: "#fff",
    borderRadius: 14,
    padding: "14px 10px",
    fontSize: 13,
    color: "#4a463f",
    cursor: "pointer",
    textAlign: "center",
    transition: "background 0.2s ease, border-color 0.2s ease, opacity 0.3s ease, transform 0.3s ease",
    fontFamily: "Arial"
  },
  archivosTarjetaDescripcion: {
    textAlign: "left",
    lineHeight: 1.4
  },
  archivosTarjetaSeleccionada: {
    borderColor: "#e29aa0",
    background: "#f3cdd2"
  },
  archivosTarjetaCorrecta: {
    borderColor: "#7fb27f",
    background: "#d4edda"
  },
  archivosTarjetaError: {
    borderColor: "#c96a6a",
    background: "#f8d7da"
  },

// ☠️ pantalla de derrota: imagen de fondo fija (como la portada) + overlay que nunca se corta
derrotaContainer: {
  position: "relative",
  width: "100vw",
  minHeight: "100vh",
  background: "#f5f1ea",
  overflow: "visible"
},
derrotaImagenFondo: {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100vh",
  objectFit: "contain",
  display: "block"
},
derrotaTituloTop: {
  position: "absolute",
  top: "6%",
  left: 0,
  right: 0,
  padding: "0 24px",
  fontSize: 16,
  fontWeight: 800,
  color: "#c0392b",
  lineHeight: 1.35,
  letterSpacing: 0.2,
  textAlign: "center",
  textShadow: "0 1px 4px rgba(255,255,255,0.85)"
},
derrotaOverlayInferior: {
  position: "relative",
  marginTop: "78vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "0 24px 24px",
  boxSizing: "border-box"
},
  derrotaSubtitulo: {
    color: "#5a5147",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
    textShadow: "0 1px 4px rgba(255,255,255,0.75)"
  },
  derrotaBoton: {
    display: "block",
    width: "100%",
    maxWidth: 320,
    border: "none",
    borderRadius: 20,
    padding: "16px 20px",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(90deg, #f2b366, #e29aa0)",
    cursor: "pointer",
    marginTop: 6,
    boxShadow: "0 8px 20px rgba(226,154,160,0.35)"
  },
  derrotaLinkVolver: {
    display: "block",
    width: "100%",
    maxWidth: 320,
    textAlign: "center",
    border: "none",
    background: "transparent",
    color: "#5a5147",
    fontSize: 13,
    padding: 10,
    marginTop: 4,
    cursor: "pointer",
    textShadow: "0 1px 4px rgba(255,255,255,0.75)"
  },

  // 🏛️ edificio visual de "Construye la Constitución"
  edificioTejado: {
    width: 0,
    height: 0,
    margin: "0 auto",
    borderLeft: "18px solid transparent",
    borderRight: "18px solid transparent",
    borderBottom: "16px solid #8a8578"
  },
  edificioPisos: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    width: "100%",
    maxWidth: 280,
    margin: "0 auto 20px"
  },
  edificioPiso: {
    height: 16,
    borderRadius: 4,
    transition: "background 0.4s ease"
  },
  construyeCasillaNombre: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "1px dashed #c9c2b4",
    background: "#faf7f2",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 700,
    color: "#4a463f",
    cursor: "pointer"
  },
  edificioMarcoDetalle: {
    maxWidth: 220,
    margin: "0 auto 20px"
  },
  edificioMarco: {
    maxWidth: 320,
    margin: "0 auto 10px"
  },
  edificioTechoImg: {
    display: "block",
    width: "100%"
  },
  edificioPlantaBajaImg: {
    display: "block",
    width: "100%"
  },
  edificioPlantasWrap: {
    display: "flex",
    flexDirection: "column"
  },
  edificioPlanta: {
    padding: "14px 16px",
    borderLeft: "6px solid rgba(0,0,0,0.08)",
    borderRight: "6px solid rgba(0,0,0,0.08)"
  },
  edificioPlantaTitulo: {
    fontWeight: 700,
    color: "#4a463f",
    margin: "0 0 2px",
    fontSize: 14
  },
  edificioPlantaSubtitulo: {
    fontSize: 12,
    color: "#6b6558",
    marginBottom: 8
  },
  archiveroGlobo: {
    marginTop: 8,
    background: "#fff",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 13,
    color: "#4a463f",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  archiveroBotonFlotante: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    border: "none",
    padding: 0,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
  },
  archiveroFotoFlotante: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block"
  },
  archiveroGloboFlotante: {
    position: "absolute",
    width: "max-content",
    maxWidth: "min(300px, 82vw)",
    minWidth: 220,
    background: "#fff",
    borderRadius: 16,
    padding: "12px 16px",
    fontSize: 13,
    lineHeight: 1.5,
    color: "#4a463f",
    boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
  },
  archiveroBotonSi: {
    flex: 1,
    border: "none",
    borderRadius: 10,
    padding: "8px 6px",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    background: "#e29aa0",
    cursor: "pointer"
  },
  archiveroBotonNo: {
    flex: 1,
    border: "1px solid #e4ddcf",
    borderRadius: 10,
    padding: "8px 6px",
    fontSize: 12,
    fontWeight: 700,
    color: "#8a8578",
    background: "#fff",
    cursor: "pointer"
  },
  construyeFeedbackTexto: {
    marginTop: 8,
    fontSize: 12,
    color: "#8a6a4f",
    fontStyle: "italic"
  }
};

styles.placeholderContainer = {
  ...styles.menuContainer,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center"
};

styles.placeholderCard = {
  background: "#fff",
  borderRadius: 20,
  padding: "40px 30px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
  maxWidth: 320
};

styles.placeholderEmoji = {
  fontSize: 42,
  marginBottom: 10
};

// 🏡 Inicio (rediseño)
styles.inicioHeader = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20
};
styles.inicioCasaIcono = {
  width: 32,
  height: 32,
  objectFit: "contain"
};
styles.inicioHeaderTexto = {
  fontSize: 14,
  fontWeight: 700,
  color: "#8a8578"
};
styles.inicioHeroCard = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  background: "#fff",
  borderRadius: 24,
  padding: "16px 20px 16px 16px",
  marginBottom: 20,
  boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
};
styles.inicioHeroIcono = {
  width: 180,
  height: 180,
  objectFit: "contain",
  flexShrink: 0
};
styles.inicioHeroTexto = { flex: 1 };
styles.inicioHeroTitulo = {
  fontSize: 16,
  fontWeight: 700,
  color: "#4a463f",
  margin: "0 0 4px"
};
styles.inicioHeroSubtitulo = {
  fontSize: 13,
  color: "#8a8578",
  margin: "0 0 10px"
};
styles.inicioHeroPill = {
  display: "inline-block",
  background: "#f2ece0",
  borderRadius: 14,
  padding: "6px 12px",
  fontSize: 12,
  color: "#6a9a6a",
  fontWeight: 600
};
styles.inicioGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 20
};
styles.inicioTarjeta = {
  border: "none",
  borderRadius: 20,
  padding: "18px 14px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  fontFamily: "Arial"
};
styles.inicioTarjetaIcono = {
  width: 110,
  height: 110,
  objectFit: "contain",
  marginBottom: 6
};
styles.inicioTarjetaIconoGrande = {
  width: 150,
  height: 150,
  objectFit: "contain",
  marginBottom: -14,
  marginLeft: -14
};
styles.inicioTarjetaTitulo = {
  fontSize: 15,
  fontWeight: 700,
  color: "#4a463f",
  margin: "0 0 4px"
};
styles.inicioTarjetaSubtitulo = {
  fontSize: 12,
  color: "#8a8578",
  margin: "0 0 12px",
  lineHeight: 1.4
};
styles.inicioTarjetaLinea = {
  width: 36,
  height: 3,
  borderRadius: 3,
  marginTop: "auto"
};
styles.inicioTarjetaLavanda = { background: "#ebe4f7" };
styles.inicioTarjetaLavandaClara = { background: "#f1ecfa" };
styles.inicioTarjetaRosa = { background: "#f8e6e8" };
styles.inicioTarjetaSalvia = { background: "#e2f0e5" };
styles.inicioTarjetaBeige = { background: "#faecd8" };
styles.inicioTarjetaMuted = { background: "#f0ede6" };
styles.inicioJardinCard = {
  background: "#fff",
  borderRadius: 24,
  padding: 20,
  marginBottom: 20,
  boxShadow: "0 4px 16px rgba(0,0,0,0.05)"
};
styles.inicioJardinTitulo = {
  fontSize: 15,
  fontWeight: 700,
  color: "#4a463f",
  margin: "0 0 2px"
};
styles.inicioJardinSubtitulo = {
  fontSize: 12,
  color: "#8a8578",
  margin: "0 0 16px"
};
styles.inicioJardinGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginBottom: 16
};
styles.inicioJardinItem = { textAlign: "center" };
styles.inicioJardinValor = {
  fontSize: 20,
  fontWeight: 700,
  color: "#4a463f",
  margin: "0 0 2px"
};
styles.inicioJardinEtiqueta = {
  fontSize: 11,
  color: "#8a8578",
  margin: 0
};
styles.inicioJardinBoton = {
  display: "block",
  width: "100%",
  border: "none",
  borderRadius: 16,
  padding: "12px 16px",
  background: "#ece4f7",
  color: "#6a4f9a",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer"
};
styles.inicioFraseFinal = {
  textAlign: "center",
  fontStyle: "italic",
  color: "#8a8578",
  fontSize: 13,
  marginTop: 4,
  marginBottom: 10
};

styles.evolucionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16
};
styles.evolucionTitulo = {
  fontSize: 22,
  fontWeight: 700,
  color: "#4a463f",
  margin: 0
};
styles.evolucionHojaDecorativa = { width: 40, height: 40, objectFit: "contain" };
styles.evolucionTabs = {
  display: "flex",
  gap: 6,
  background: "#fff",
  borderRadius: 18,
  padding: 5,
  marginBottom: 18,
  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
};
styles.evolucionTabBtn = {
  flex: 1,
  border: "none",
  background: "transparent",
  borderRadius: 14,
  padding: "10px 8px",
  fontSize: 13,
  fontWeight: 600,
  color: "#8a8578",
  cursor: "pointer"
};
styles.evolucionTabBtnActiva = {
  background: "#ece4f7",
  color: "#5a4676"
};
styles.evolucionAnilloCard = {
  background: "#fff",
  borderRadius: 24,
  padding: "22px 20px",
  textAlign: "center",
  marginBottom: 16,
  boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
};
styles.evolucionAnilloTitulo = {
  fontSize: 14,
  fontWeight: 700,
  color: "#4a463f",
  marginBottom: 10
};
styles.evolucionAnilloSubtitulo = {
  fontSize: 13,
  color: "#8a8578",
  marginTop: 8
};
styles.evolucionStatsRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 16
};
styles.evolucionStatItem = {
  flex: 1,
  background: "#fff",
  borderRadius: 18,
  padding: "14px 8px",
  textAlign: "center",
  boxShadow: "0 3px 10px rgba(0,0,0,0.03)"
};
styles.evolucionStatIcono = { width: 36, height: 36, objectFit: "contain", marginBottom: 2 };
styles.evolucionStatValor = { fontSize: 18, fontWeight: 700, color: "#4a463f", margin: "2px 0" };
styles.evolucionStatEtiqueta = { fontSize: 10, color: "#8a8578", margin: 0, lineHeight: 1.3 };
styles.evolucionMensajeCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#fff",
  borderRadius: 20,
  padding: 16,
  marginBottom: 18,
  boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
};
styles.evolucionMensajeIcono = { width: 64, height: 64, objectFit: "contain", flexShrink: 0 };
styles.evolucionMensajeTexto = { fontSize: 13, color: "#4a463f", margin: 0, lineHeight: 1.5 };
styles.evolucionEnlace = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "#fff",
  borderRadius: 16,
  padding: "14px 16px",
  marginBottom: 10,
  fontSize: 14,
  fontWeight: 600,
  color: "#4a463f",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
};

styles.repasarHeroImg = {
  display: "block",
  width: 160,
  margin: "0 auto 8px"
};
styles.repasarResumenCard = {
  display: "flex",
  background: "#fff",
  borderRadius: 22,
  padding: "18px 10px",
  marginBottom: 18,
  boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
};
styles.repasarResumenItem = {
  flex: 1,
  textAlign: "center",
  borderRight: "1px solid #f0ece2"
};
styles.repasarResumenIcono = { width: 40, height: 40, objectFit: "contain", marginBottom: 4 };
styles.repasarResumenValor = { fontSize: 20, fontWeight: 700, color: "#4a463f", margin: "2px 0" };
styles.repasarResumenEtiqueta = { fontSize: 11, color: "#8a8578", margin: 0 };
styles.repasarFilaCard = {
  borderRadius: 22,
  padding: 16,
  marginBottom: 14
};
styles.repasarFilaIcono = { width: 56, height: 56, objectFit: "contain", flexShrink: 0 };
styles.repasarFilaTitulo = { fontSize: 14, fontWeight: 700, color: "#4a463f", margin: "0 0 4px" };
styles.repasarFilaTexto = { fontSize: 12, color: "#5a5650", margin: 0, lineHeight: 1.4 };
// 📁 "Elige un expediente" (Conecta la Constitución)
styles.expedienteCard = {
  background: "#fff",
  borderRadius: 24,
  padding: "24px 20px",
  marginBottom: 16,
  textAlign: "center",
  boxShadow: "0 4px 14px rgba(0,0,0,0.05)"
};
styles.expedienteIcono = {
  width: 110,
  height: 110,
  objectFit: "contain",
  margin: "0 auto 12px"
};
styles.expedienteTitulo = {
  fontSize: 16,
  fontWeight: 700,
  color: "#4a463f",
  margin: "0 0 6px"
};
styles.expedienteDescripcion = {
  fontSize: 12,
  color: "#8a8578",
  margin: "0 0 16px",
  lineHeight: 1.5
};
styles.expedienteBoton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "none",
  borderRadius: 16,
  padding: "12px 22px",
  fontSize: 14,
  fontWeight: 700,
  color: "#4a463f",
  cursor: "pointer"
};

// 👤 Mi perfil
styles.perfilHeaderRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8
};
styles.perfilHeaderIcono = {
  width: 36,
  height: 36,
  objectFit: "contain"
};
styles.perfilHeroImg = {
  display: "block",
  width: 220,
  margin: "0 auto 22px"
};
styles.perfilNotaCard = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#faf3e8",
  border: "1px dashed #e4ddcf",
  borderRadius: 18,
  padding: "14px 16px",
  marginTop: 16,
  marginBottom: 4,
  fontSize: 12,
  color: "#4a463f",
  lineHeight: 1.5
};

// 📝 Resultado del Simulacro (rediseño)
styles.simIntentoPill = {
  display: "inline-block",
  background: "#faf3e8",
  border: "1px dashed #e4ddcf",
  borderRadius: 14,
  padding: "8px 20px",
  fontSize: 14,
  color: "#6b6558",
  fontWeight: 700,
  marginBottom: 18
};
styles.simNotaCard = {
  background: "#fff",
  borderRadius: 24,
  padding: "22px 20px",
  textAlign: "center",
  marginBottom: 16,
  boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
};
styles.simNotaEtiqueta = {
  fontSize: 13,
  color: "#8a8578",
  margin: "0 0 4px"
};
styles.simNotaValor = {
  fontSize: 42,
  fontWeight: 700,
  color: "#4a463f",
  margin: 0
};
styles.simNotaSobre = {
  fontSize: 12,
  color: "#8a8578",
  margin: "2px 0 0"
};
styles.simStatGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  marginBottom: 16
};
styles.simStatCard = {
  background: "#fff",
  borderRadius: 16,
  padding: "12px 4px",
  textAlign: "center",
  boxShadow: "0 3px 10px rgba(0,0,0,0.03)"
};
styles.simStatIcono = { width: 28, height: 28, objectFit: "contain", marginBottom: 4 };
styles.simStatValor = { fontSize: 15, fontWeight: 700, color: "#4a463f", margin: "2px 0" };
styles.simStatEtiqueta = { fontSize: 9, color: "#8a8578", margin: 0, lineHeight: 1.25 };
styles.simHeroImg = {
  display: "block",
  width: 170,
  margin: "0 auto 8px"
};
styles.simRepasoBoton = {
  display: "block",
  width: "100%",
  border: "none",
  borderRadius: 22,
  padding: "16px 22px",
  marginTop: 4,
  marginBottom: 10,
  fontSize: 15,
  fontWeight: 700,
  color: "#3f5a46",
  background: "#c9e4d0",
  cursor: "pointer",
  textAlign: "center"
};
styles.simValoracionCard = {
  background: "#fff",
  borderRadius: 20,
  padding: "16px 18px",
  marginBottom: 16,
  boxShadow: "0 3px 12px rgba(0,0,0,0.035)"
};
styles.simValoracionToggle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  fontSize: 14,
  fontWeight: 700,
  color: "#4a463f",
  cursor: "pointer"
};
styles.simValoracionTexto = {
  fontSize: 13,
  color: "#4a463f",
  lineHeight: 1.6,
  marginTop: 12
};
styles.simValoracionListaTitulo = {
  fontSize: 12,
  fontWeight: 700,
  color: "#8a8578",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  margin: "14px 0 6px"
};

styles.repasarBoton = {
  display: "block",
  width: "100%",
  border: "none",
  borderRadius: 14,
  padding: "10px 14px",
  marginTop: 12,
  fontSize: 13,
  fontWeight: 700,
  color: "#4a463f",
  cursor: "pointer"
};

// 🗂️ Repasar errores — estado vacío por categoría
styles.erroresVacioIlustracion = {
  display: "block",
  width: 170,
  margin: "10px auto 18px"
};
styles.erroresVacioTitulo = {
  textAlign: "center",
  fontSize: 20,
  fontWeight: 700,
  color: "#4a463f",
  margin: "0 0 10px"
};
styles.erroresVacioSubtitulo = {
  textAlign: "center",
  fontSize: 13,
  color: "#8a8578",
  lineHeight: 1.6,
  marginBottom: 26,
  padding: "0 8px"
};

export { globalStyles, styles };