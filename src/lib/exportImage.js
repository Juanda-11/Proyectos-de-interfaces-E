import { META } from './componentTypes'
import { velocity } from './hydraulics'
import { translate as t } from '../i18n'

/** Colores del diagrama exportado según el tema (el SVG no puede usar las variables CSS de la app). */
const PALETTES = {
  dark: {
    bg: '#0F172A',
    node: '#1E293B',
    outline: '#0B1220',
    title: '#E2E8F0',
    label: '#CBD5E1',
    muted: '#94A3B8',
    warnLabel: '#FDBA74',
    pressure: '#7DD3FC',
    badPressure: '#FB923C',
  },
  light: {
    bg: '#F1F5F9',
    node: '#FFFFFF',
    outline: '#CBD5E1',
    title: '#0F172A',
    label: '#334155',
    muted: '#475569',
    warnLabel: '#C2410C',
    pressure: '#0369A1',
    badPressure: '#EA580C',
  },
}
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
    title = t('export.title'),
    theme = 'dark',
  } = {},
) {
  const c = PALETTES[theme] ?? PALETTES.dark
  const halo = `stroke="${c.bg}" stroke-width="3" paint-order="stroke" stroke-linejoin="round"`
  const xs = net.nodes.length ? net.nodes.map((n) => n.x) : [0]
  const ys = net.nodes.length ? net.nodes.map((n) => n.y) : [0]
  const x0 = Math.min(...xs) - PAD
  const y0 = Math.min(...ys) - PAD - 30
  const x1 = Math.max(...xs) + PAD
  const y1 = Math.max(...ys) + PAD
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
  <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${c.outline}" stroke-width="${w + 6}" stroke-linecap="round"/>
  <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${idle ? 0.6 : 1}"/>
  <text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - w - 8}" text-anchor="middle" font-size="10" fill="${warn ? c.warnLabel : c.muted}" ${halo}>${esc(label)}</text>
</g>`
    })
    .join('\n')

  const nodes = net.nodes
    .map((n) => {
      const color = META[n.type].color
      const res = nodeResult(n.id)
      const pressure =
        typeof res?.pressure === 'number' ? res.pressure.toFixed(1) + ' ' + t('unit.pressure') : ''
      const bad = res && res.status !== 'ok'
      return `<g transform="translate(${n.x - NODE / 2},${n.y - NODE / 2})">
  <rect width="${NODE}" height="${NODE}" rx="14" fill="${c.node}" stroke="${bad ? '#F97316' : color}" stroke-width="1.5"/>
  <text x="${NODE / 2}" y="${NODE / 2 + 8}" text-anchor="middle" font-size="22" font-weight="600" fill="${color}">${GLYPH[n.type]}</text>
  <text x="${NODE / 2}" y="${NODE + 18}" text-anchor="middle" font-size="11" fill="${c.label}" ${halo}>${esc(n.name)}</text>${pressure ? `\n  <text x="${NODE / 2}" y="${NODE + 32}" text-anchor="middle" font-size="10" fill="${bad ? c.badPressure : c.pressure}" ${halo}>${pressure}</text>` : ''}
</g>`
    })
    .join('\n')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x0} ${y0} ${width} ${height}" font-family="'JetBrains Mono', ui-monospace, Consolas, monospace">
<title>${esc(title)}</title>
<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="${c.bg}"/>
<text x="${x0 + 24}" y="${y0 + 34}" font-size="14" font-weight="600" fill="${c.title}" font-family="Inter, system-ui, sans-serif">${esc(title)}</text>
${pipes}
${nodes}
</svg>
`
  return { svg, width, height }
}

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
        (blob) => (blob ? resolve(blob) : reject(new Error(t('export.pngFailed')))),
        'image/png',
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(t('export.renderFailed')))
    }
    img.src = url
  })
}
