"use client";

interface Elemento {
  id: string;
  nombre: string;
}

interface PropiedadesColumnaNavegacion<T extends Elemento> {
  titulo: string; // Ej: "CANALES"
  nombreElemento: string; // Ej: "canal" (para los textos)
  icono: string; // Ej: "#"
  claseActiva: string; // Clases del elemento seleccionado
  elementos: T[];
  cargando: boolean;
  error: Error | null;
  idActivo?: string;
  esAdministrador: boolean;
  alSeleccionar: (elemento: T) => void;
  alCrear: (nombre: string) => Promise<unknown>;
  alEliminar: (elemento: T) => Promise<void>;
  mensajeConfirmacion: (elemento: T) => string;
}

/**
 * Columna genérica de navegación (canales, subcanales, hilos):
 * encabezado con botón "+", estados de carga/vacío/error y lista con papelera.
 */
export default function ColumnaNavegacion<T extends Elemento>({
  titulo,
  nombreElemento,
  icono,
  claseActiva,
  elementos,
  cargando,
  error,
  idActivo,
  esAdministrador,
  alSeleccionar,
  alCrear,
  alEliminar,
  mensajeConfirmacion,
}: PropiedadesColumnaNavegacion<T>) {
  const manejarCrear = async () => {
    const nombre = prompt(`Nombre del nuevo ${nombreElemento}:`);
    if (!nombre?.trim()) return;
    try {
      await alCrear(nombre.trim());
    } catch (err) {
      console.error(`Error al crear ${nombreElemento}:`, err);
      alert(`No se pudo crear el ${nombreElemento}.`);
    }
  };

  const manejarEliminar = async (e: React.MouseEvent, elemento: T) => {
    e.stopPropagation(); // Evita que se seleccione el elemento al dar clic en la papelera
    if (!confirm(mensajeConfirmacion(elemento))) return;
    try {
      await alEliminar(elemento);
    } catch (err) {
      console.error(`Error al eliminar ${nombreElemento} en cascada:`, err);
      alert(`Hubo un problema de permisos o conexión al intentar eliminar el ${nombreElemento}.`);
    }
  };

  return (
    <div className="w-52 flex-shrink-0 bg-[#2b2d31] flex flex-col border-r border-white/10 h-full">
      <div className="h-14 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">{titulo}</h2>
        {esAdministrador && (
          <button
            onClick={manejarCrear}
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors"
            title={`Crear ${nombreElemento}`}
          >
            +
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cargando && <p className="text-gray-400 text-xs px-2 mt-2">Cargando {titulo.toLowerCase()}...</p>}

        {error && <p className="text-rose-400 text-xs px-2 mt-2">No se pudieron cargar los {titulo.toLowerCase()}.</p>}

        {!cargando && !error && elementos.length === 0 && (
          <p className="text-gray-400 text-xs px-2 mt-2">
            {esAdministrador
              ? `No hay ${titulo.toLowerCase()}. Crea el primero con +`
              : `No hay ${titulo.toLowerCase()} disponibles.`}
          </p>
        )}

        {elementos.map((elemento) => (
          <div
            key={elemento.id}
            onClick={() => alSeleccionar(elemento)}
            className={`group w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between cursor-pointer ${
              idActivo === elemento.id ? claseActiva : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <span className="text-gray-500 flex-shrink-0">{icono}</span>
              <span className="truncate">{elemento.nombre}</span>
            </div>

            {esAdministrador && (
              <button
                onClick={(e) => manejarEliminar(e, elemento)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-all p-1 text-xs ml-2 flex-shrink-0"
                title={`Eliminar ${nombreElemento}`}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
