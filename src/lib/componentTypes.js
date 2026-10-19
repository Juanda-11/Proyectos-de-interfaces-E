import { Container, Fan, SlidersHorizontal, CircleDot } from 'lucide-react'
import { translate } from '../i18n'

/**
 * Catálogo de componentes del editor: etiqueta, icono, color y valores iniciales.
 * `label` es un getter: devuelve el nombre en el idioma activo en el momento de leerlo.
 */
const type = (key, icon, color, props) => ({
  get label() {
    return translate(`type.${key}`)
  },
  icon,
  color,
  props,
})

export const META = {
  tank: type('tank', Container, '#0EA5E9', { pressure: 15, elevation: 15 }),
  pump: type('pump', Fan, '#10B981', { pressure: 30, elevation: 0 }),
  valve: type('valve', SlidersHorizontal, '#F59E0B', { pressure: 25, elevation: 0 }),
  junction: type('junction', CircleDot, '#A78BFA', { pressure: 22, elevation: 0, demand: 4 }),
}
