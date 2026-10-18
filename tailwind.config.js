module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { app: '#0F172A', panel: '#1E293B', line: '#334155' },
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
