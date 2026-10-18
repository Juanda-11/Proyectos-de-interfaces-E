import { Container, Fan, SlidersHorizontal, CircleDot } from 'lucide-react'

/** Catálogo de componentes del editor: etiqueta, icono, color y valores iniciales. */
export const META = {
  tank: { label: 'Tanque', icon: Container, color: '#0EA5E9', props: { pressure: 15, elevation: 15 } },
  pump: { label: 'Bomba', icon: Fan, color: '#10B981', props: { pressure: 30, elevation: 0 } },
  valve: { label: 'Válvula', icon: SlidersHorizontal, color: '#F59E0B', props: { pressure: 25, elevation: 0 } },
  junction: { label: 'Nodo', icon: CircleDot, color: '#A78BFA', props: { pressure: 22, elevation: 0, demand: 4 } },
}
