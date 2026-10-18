/**
 * URL base del backend. Vacía = mismo origen (en desarrollo, Vite redirige /api a
 * localhost:3001). En producción se define con VITE_API_URL al compilar.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

/** Tiempo máximo de espera de una petición al backend (ms). */
export const API_TIMEOUT_MS = 20000
