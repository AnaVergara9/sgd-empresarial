import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Iniciales para los avatares (ej: Paula Cubillos -> PC)
export function obtenerIniciales(nombre: string) {
  if (!nombre) return "?"
  return nombre
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
