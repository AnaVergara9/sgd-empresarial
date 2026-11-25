import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

const LARGO_MAXIMO = 50;

interface PropiedadesFormularioCrear {
  nombreElemento: string; // Ej: "canal"
  icono: string; // Ej: "#"
  nombresExistentes: string[];
  alCrear: (nombre: string) => Promise<unknown>;
  alCerrar: () => void;
}

/**
 * Campo para crear un canal, subcanal o hilo dentro de la misma columna.
 * Enter crea, Esc cancela. Los errores se muestran debajo del campo.
 */
export default function FormularioCrear({
  nombreElemento,
  icono,
  nombresExistentes,
  alCrear,
  alCerrar,
}: PropiedadesFormularioCrear) {
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campoRef.current?.focus();
  }, []);

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (creando) return;

    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (!limpio) {
      setError(`Escribe el nombre del ${nombreElemento}.`);
      return;
    }
    const repetido = nombresExistentes.some((n) => n.trim().toLowerCase() === limpio.toLowerCase());
    if (repetido) {
      setError(`Ya existe un ${nombreElemento} con ese nombre.`);
      return;
    }

    setCreando(true);
    setError(null);
    try {
      await alCrear(limpio);
      alCerrar();
    } catch (err) {
      console.error(`Error al crear ${nombreElemento}:`, err);
      setError(
        navigator.onLine
          ? `No se pudo crear el ${nombreElemento}. Revisa la conexión con el servidor.`
          : `Sin conexión: no se puede crear el ${nombreElemento} ahora.`
      );
      setCreando(false);
      // Devuelve el foco al campo para corregir o reintentar
      requestAnimationFrame(() => campoRef.current?.focus());
    }
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      alCerrar();
    }
  };

  // Si se sale del campo sin haber escrito nada, se cierra solo
  const alSalir = () => {
    if (!creando && !nombre.trim()) alCerrar();
  };

  return (
    <form onSubmit={enviar} className="mb-2 px-1">
      <div
        className={`flex items-center gap-2 rounded-md bg-[#1e1f22] px-2.5 py-1.5 ring-1 transition-colors ${
          error ? "ring-rose-500/70" : "ring-[#5865f2]"
        }`}
      >
        <span className="text-gray-500 text-sm flex-shrink-0">{icono}</span>
        <input
          ref={campoRef}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={alPresionarTecla}
          onBlur={alSalir}
          maxLength={LARGO_MAXIMO}
          disabled={creando}
          placeholder={`Nombre del ${nombreElemento}`}
          aria-label={`Nombre del nuevo ${nombreElemento}`}
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-60"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-1.5 px-1 text-[11px] leading-snug text-rose-400">
          {error}
        </p>
      ) : (
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-gray-500">
          <span>
            {creando ? (
              "Creando..."
            ) : (
              <>
                <kbd className="font-sans text-gray-300">Enter</kbd> crear ·{" "}
                <kbd className="font-sans text-gray-300">Esc</kbd> cancelar
              </>
            )}
          </span>
          {nombre.length > LARGO_MAXIMO - 10 && (
            <span>
              {nombre.length}/{LARGO_MAXIMO}
            </span>
          )}
        </div>
      )}
    </form>
  );
}
