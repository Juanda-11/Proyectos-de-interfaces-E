import { Container, Fan, SlidersHorizontal, CircleDot } from 'lucide-react'

export const META = {
  tank:     { label: 'Tanque',  icon: Container,         color: '#0EA5E9', props: { pressure: 15, elevation: 15 } },
  pump:     { label: 'Bomba',   icon: Fan,               color: '#10B981', props: { pressure: 30, elevation: 0 } },
  valve:    { label: 'Válvula', icon: SlidersHorizontal, color: '#F59E0B', props: { pressure: 25, elevation: 0 } },
  junction: { label: 'Nódulo',  icon: CircleDot,         color: '#A78BFA', props: { pressure: 22, elevation: 0, demand: 4 } },
}

/** Velocidad (m/s) = Q / A, con Q en L/s y diámetro en mm */
export const velocity = (p) => (p.flow / 1000) / (Math.PI * (p.diameter / 1000) ** 2 / 4)
export const MAX_V = 2.5
export const pipeStatus = (p, running) => (!running ? 'idle' : velocity(p) > MAX_V ? 'warn' : 'ok')
/** Diámetro comercial mínimo (múltiplo de 25 mm) para v <= 2 m/s */
export const suggestDiameter = (p) => Math.ceil((Math.sqrt((4 * (p.flow / 1000)) / (Math.PI * 2)) * 1000) / 25) * 25

const node = (id, type, x, y, name) => ({ id, type, x, y, name, ...META[type].props })
const pipe = (id, from, to, diameter, flow) => ({ id, from, to, diameter, flow })

/** Red demo: tanque -> bomba -> nodo -> n sectores (el último con tubería subdimensionada) */
export function makeSectors(n = 3) {
  const nodes = [node('T1', 'tank', 120, 300, 'Tanque T1'), node('P1', 'pump', 280, 300, 'Bomba B1'), node('J1', 'junction', 440, 300, 'Nodo J1')]
  const pipes = [pipe('a', 'T1', 'P1', 150, 4 * n), pipe('b', 'P1', 'J1', 150, 4 * n)]
  for (let i = 0; i < n; i++) {
    const id = `S${i + 1}`
    nodes.push(node(id, 'junction', 660, 300 + (i - (n - 1) / 2) * 120, `Sector ${i + 1}`))
    pipes.push(i === n - 1 ? pipe(`c${i}`, 'J1', id, 50, 8) : pipe(`c${i}`, 'J1', id, 100, 4))
  }
  return { nodes, pipes }
}
