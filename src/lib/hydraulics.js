/** Cálculos hidráulicos básicos que el editor puede hacer sin conexión al backend. */

/** Velocidad máxima recomendada (m/s). */
export const MAX_V = 2.5
/** Velocidad de diseño usada para sugerir diámetros (m/s). */
export const DESIGN_V = 2

/** Velocidad (m/s) = Q / A, con Q en L/s y diámetro en mm. */
export const velocity = (p) => p.flow / 1000 / ((Math.PI * (p.diameter / 1000) ** 2) / 4)

export const pipeStatus = (p, running) => (!running ? 'idle' : velocity(p) > MAX_V ? 'warn' : 'ok')

/** Diámetro comercial mínimo (múltiplo de 25 mm) para v <= 2 m/s. */
export const suggestDiameter = (p) =>
  Math.max(25, Math.ceil((Math.sqrt((4 * (p.flow / 1000)) / (Math.PI * DESIGN_V)) * 1000) / 25) * 25)
