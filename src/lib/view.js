const MIN_K = 0.3
const MAX_K = 3
/** Margen alrededor de los componentes (px del mundo): deja sitio a los nombres y las etiquetas. */
const MARGIN = 110

/**
 * Vista (desplazamiento y zoom) que encuadra todos los nodos en un lienzo de `width` × `height`.
 * Sin nodos devuelve la vista inicial. No acerca más de 150 % para que una red pequeña no se vea gigante.
 */
export function fitView(nodes, width, height) {
  if (!nodes.length || width <= 0 || height <= 0) return { x: 0, y: 0, k: 1 }
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const x0 = Math.min(...xs) - MARGIN
  const y0 = Math.min(...ys) - MARGIN
  const w = Math.max(...xs) + MARGIN - x0
  const h = Math.max(...ys) + MARGIN - y0
  const k = Math.min(MAX_K, 1.5, Math.max(MIN_K, Math.min(width / w, height / h)))
  return { k, x: (width - w * k) / 2 - x0 * k, y: (height - h * k) / 2 - y0 * k }
}
