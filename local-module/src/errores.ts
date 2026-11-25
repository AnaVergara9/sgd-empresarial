/**
 * Error que no se arregla reintentando: el servidor respondió y rechazó el envío
 * (por ejemplo, 400 o 413). La cola lo marca como "error" y deja de reintentarlo.
 *
 * Cualquier otro error (sin red, servidor caído, 5xx) se trata como temporal.
 */
export class ErrorPermanente extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorPermanente";
  }
}

// Códigos HTTP que sí vale la pena reintentar.
const TEMPORALES = new Set([408, 425, 429]);

export function esEstadoPermanente(status: number): boolean {
  return status >= 400 && status < 500 && !TEMPORALES.has(status);
}
