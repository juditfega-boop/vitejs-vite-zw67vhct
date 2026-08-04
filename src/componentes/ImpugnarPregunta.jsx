import { useState } from "react";
import { enviarImpugnacion } from "../servicios/impugnaciones";

const MOTIVOS = [
  "Pregunta no literal (no se ajusta exactamente al artículo)",
  "La respuesta marcada como correcta es errónea",
  "Pregunta mal formulada",
  "Explicación confusa o mejorable",
  "Pregunta de otro tema",
  "Otro"
];

export default function ImpugnarPregunta({ pregunta, origen }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function reset() {
    setAbierto(false);
    setMotivo(null);
    setComentario("");
    setEnviado(false);
  }

  async function enviar() {
    if (!motivo) return;
    setEnviando(true);
    const ok = await enviarImpugnacion({ pregunta, motivo, comentario, origen });
    setEnviando(false);
    if (ok) setEnviado(true);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          display: "block", width: "100%", textAlign: "center", border: "none",
          background: "transparent", color: "#b08a8a", fontSize: 12,
          padding: "8px 0", marginTop: 4, cursor: "pointer"
        }}
      >
        ⚠️ Impugnar esta pregunta
      </button>
    );
  }

  if (enviado) {
    return (
      <div style={{
        background: "#eaf4ec", borderRadius: 14, padding: "14px 16px",
        marginTop: 10, fontSize: 13, color: "#3f5a46", textAlign: "center"
      }}>
        Gracias, hemos recibido tu impugnación.
        <button
          onClick={reset}
          style={{ display: "block", margin: "8px auto 0", border: "none", background: "transparent", color: "#6b8a70", fontSize: 12, cursor: "pointer" }}
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: "#faf3e8", border: "1px dashed #e4ddcf", borderRadius: 16,
      padding: "14px 16px", marginTop: 10
    }}>
      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#4a463f" }}>
        ¿Qué falla en esta pregunta?
      </p>

      {MOTIVOS.map((m) => (
        <button
          key={m}
          onClick={() => setMotivo(m)}
          style={{
            display: "block", width: "100%", textAlign: "left", border: "1px solid #e4ddcf",
            borderRadius: 10, padding: "8px 10px", marginBottom: 6, fontSize: 12,
            background: motivo === m ? "#e29aa0" : "#fff",
            color: motivo === m ? "#fff" : "#4a463f", cursor: "pointer"
          }}
        >
          {m}
        </button>
      ))}

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Añade un comentario si quieres (opcional)"
        rows={3}
        style={{
          width: "100%", boxSizing: "border-box", border: "1px solid #e4ddcf",
          borderRadius: 10, padding: 8, fontSize: 12, fontFamily: "Arial",
          marginTop: 4, marginBottom: 10, resize: "vertical"
        }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={enviar}
          disabled={!motivo || enviando}
          style={{
            flex: 1, border: "none", borderRadius: 12, padding: "10px 0",
            fontSize: 13, fontWeight: 700, color: "#fff",
            background: !motivo || enviando ? "#d8cfc0" : "#e29aa0",
            cursor: !motivo || enviando ? "not-allowed" : "pointer"
          }}
        >
          {enviando ? "Enviando..." : "Enviar impugnación"}
        </button>
        <button
          onClick={reset}
          style={{
            border: "1px solid #e4ddcf", borderRadius: 12, padding: "10px 14px",
            fontSize: 13, background: "#fff", color: "#8a8578", cursor: "pointer"
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}