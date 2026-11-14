import { useEffect, useState } from "react";
import { observarSesion } from "./auth";
import { obtenerEstadoAcceso } from "./accesos";

// estado: "cargando" | "sin-cuenta" | "pendiente" | "aprobada"
export function useAcceso() {
  const [usuario, setUsuario] = useState(undefined);
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    return observarSesion(async (u) => {
      setUsuario(u);
      if (!u) {
        setEstado("sin-cuenta");
        return;
      }
      setEstado("cargando");
      try {
        setEstado(await obtenerEstadoAcceso(u));
      } catch {
        setEstado("pendiente");
      }
    });
  }, []);

  return { usuario, estado };
}