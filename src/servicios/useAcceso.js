import { useEffect, useState } from "react";
import { observarSesion, cerrarSesion } from "./auth";
import { obtenerEstadoAcceso, ADMIN_UID } from "./accesos";
import { vigilarSesion } from "./sesion";

// estado: "cargando" | "sin-cuenta" | "pendiente" | "aprobada"
// alSerExpulsada: se llama si la cuenta se abre en otro dispositivo
export function useAcceso(alSerExpulsada) {
  const [usuario, setUsuario] = useState(undefined);
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    let dejarDeVigilar = null;

    const dejarDeObservar = observarSesion(async (u) => {
      if (dejarDeVigilar) {
        dejarDeVigilar();
        dejarDeVigilar = null;
      }

      setUsuario(u);
      if (!u) {
        setEstado("sin-cuenta");
        return;
      }

      // 📱 una sola sesión activa por cuenta (la administradora no tiene límite)
      if (u.uid !== ADMIN_UID) {
        dejarDeVigilar = vigilarSesion(u.uid, async () => {
          await cerrarSesion();
          if (alSerExpulsada) alSerExpulsada();
        });
      }

      setEstado("cargando");
      try {
        setEstado(await obtenerEstadoAcceso(u));
      } catch {
        setEstado("pendiente");
      }
    });

    return () => {
      dejarDeObservar();
      if (dejarDeVigilar) dejarDeVigilar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { usuario, estado };
}