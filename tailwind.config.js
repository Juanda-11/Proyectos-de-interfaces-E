const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

/** Tonos que cambian con el tema (claro/oscuro): los valores están en src/index.css */
const themed = (name, shades) => Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)]))

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: v('app'),
        panel: v('panel'),
        line: v('line'),
        slate: themed('slate', [100, 200, 300, 400, 500]),
        sky: themed('sky', [100, 300, 400]),
        orange: themed('orange', [300, 400]),
        red: themed('red', [100, 200, 300, 400]),
        emerald: themed('emerald', [100, 400]),
        violet: themed('violet', [100, 200, 300]),
        fuchsia: themed('fuchsia', [400]),
        amber: themed('amber', [300]),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        water: 'linear-gradient(135deg,#0EA5E9,#2563EB)',
        ai: 'linear-gradient(135deg,#8B5CF6,#EC4899)',
        danger: 'linear-gradient(135deg,#F97316,#EF4444)',
      },
    },
  },
  plugins: [],
}
