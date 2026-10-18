import { META } from './componentTypes'
import { velocity } from './hydraulics'

const PAD = 90
const NODE = 56
const GLYPH = { tank: 'T', pump: 'B', valve: 'V', junction: 'N' }
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c],
  )

/**
 * Dibuja la red como un SVG autónomo (sin clases CSS ni fuentes externas) para
 * incluirla en informes. `statusOfPipe(pipe)` decide el color de cada tubería.
 */
export function networkToSvg(
  net,
  {
    statusOfPipe = () => 'idle',
    nodeResult = () => null,
    title = 'HydroGraph AI · Red de distribución',
  } = {},
) {
  const xs = net.nodes.map((n) => n.x)
  const ys = net.nodes.map((n) => n.y)
  const x0 = Math.min(...xs, 0) - PAD
  const y0 = Math.min(...ys, 0) - PAD - 30
  const x1 = Math.max(...xs, 0) + PAD
  const y1 = Math.max(...ys, 0) + PAD
  const width = Math.max(1, Math.round(x1 - x0))
  const height = Math.max(1, Math.round(y1 - y0))
  const byId = new Map(net.nodes.map((n) => [n.id, n]))

  const pipes = net.pipes
    .map((p) => {
      const a = byId.get(p.from)
      const b = byId.get(p.to)
      if (!a || !b) return ''
      const warn = statusOfPipe(p) === 'warn'
      const idle = statusOfPipe(p) === 'idle'
      const w = Math.max(5, p.diameter / 14)
      const color = warn ? '#F97316' : '#0EA5E9'
      const label = `DN${p.diameter} · ${velocity(p).toFixed(1)} m/s`
      return `<g>
  <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#0B1220" stroke-width="${w + 6}" stroke-linecap="round"/>
  <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${idle ? 0.6 : 1}"/>
  <text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - w - 8}" text-anchor="middle" font-size="10" fill="${warn ? '#FDBA74' : '#94A3B8'}" ${HALO}>${esc(label)}</text>
</g>`
    })
    .join('\n')

  const nodes = net.nodes
    .map((n) => {
      const color = META[n.type].color
      const res = nodeResult(n.id)
      const pressure = typeof res?.pressure === 'number' ? res.pressure.toFixed(1) + ' m.c.a.' : ''
      const bad = res && res.status !== 'ok'
      return `<g transform="translate(${n.x - NODE / 2},${n.y - NODE / 2})">
  <rect width="${NODE}" height="${NODE}" rx="14" fill="#1E293B" stroke="${bad ? '#F97316' : color}" stroke-width="1.5"/>
  <text x="${NODE / 2}" y="${NODE / 2 + 8}" text-anchor="middle" font-size="22" font-weight="600" fill="${color}">${GLYPH[n.type]}</text>
  <text x="${NODE / 2}" y="${NODE + 18}" text-anchor="middle" font-size="11" fill="#CBD5E1" ${HALO}>${esc(n.name)}</text>${pressure ? `\n  <text x="${NODE / 2}" y="${NODE + 32}" text-anchor="middle" font-size="10" fill="${bad ? '#FB923C' : '#7DD3FC'}" ${HALO}>${pressure}</text>` : ''}
</g>`
    })
    .join('\n')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x0} ${y0} ${width} ${height}" font-family="'JetBrains Mono', ui-monospace, Consolas, monospace">
<title>${esc(title)}</title>
<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="#0F172A"/>
<text x="${x0 + 24}" y="${y0 + 34}" font-size="14" font-weight="600" fill="#E2E8F0" font-family="Inter, system-ui, sans-serif">${esc(title)}</text>
${pipes}
${nodes}
</svg>
`
  return { svg, width, height }
}

const HALO = 'stroke="#0F172A" stroke-width="3" paint-order="stroke" stroke-linejoin="round"'

/** Rasteriza un SVG a PNG en el navegador (escala 2 por defecto para pantallas nítidas). */
export function svgToPngBlob(svg, width, height, scale = 2) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar el PNG'))),
        'image/png',
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo renderizar la imagen'))
    }
    img.src = url
  })
}
