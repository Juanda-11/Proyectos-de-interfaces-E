# HydroGraph AI — Avance 50 %

## Ejecutar
```bash
npm install
npm run dev            # solo navegador (http://localhost:5173)
npm run electron:dev   # ventana de escritorio Electron con recarga en vivo
npm run build && npm run electron   # versión empaquetada local
```

## Estructura
```
hydrograph-ai/
├── electron/main.js          # Main process: crea la ventana
├── src/
│   ├── main.jsx · index.css  # Entrada + Tailwind + animaciones (flow, alert, rise)
│   ├── App.jsx               # Estado global: red, selección, herramienta, simulación
│   ├── data.js               # Tipos de componente, hidráulica (v = Q/A), red demo
│   └── components/
│       ├── TopBar.jsx        # Título, badge de estado, Simular Flujo, Exportar
│       ├── Toolbar.jsx       # Paleta: Tanque, Bomba, Válvula, Tubería, Nódulo
│       ├── Canvas.jsx        # SVG con cuadrícula, arrastre, snap 20 px, flujo animado
│       ├── Inspector.jsx     # Propiedades dinámicas + sugerencia IA
│       └── Copilot.jsx       # Barra flotante Ctrl+K con carga y respuesta simulada
├── tailwind.config.js        # Colores app/panel/line + bg-water / bg-ai / bg-danger
└── vite.config.mjs · postcss.config.js · package.json
```

## Clases Tailwind clave
| Clase | Uso |
|---|---|
| `bg-app` `bg-panel` `border-line` | Fondos #0F172A / #1E293B y bordes |
| `bg-water` | Degradado azul (botón Simular, herramienta activa) |
| `bg-ai` | Degradado violeta-magenta (copiloto) |
| `bg-danger` | Degradado naranja-rojo (advertencias) |
| `p-[1.5px] bg-ai rounded-2xl` | Borde degradado (truco de padding) |
| `backdrop-blur-xl` | Efecto cristal de la consola IA |
| `font-mono tabular-nums` | Datos técnicos alineados |
| `.flow` `.alert` `.rise` (index.css) | Flujo del agua, pulso de alerta, entrada de paneles |

## Cómo probar
1. Pulsa **Simular Flujo**: el agua fluye y la tubería al Sector 3 se pone naranja-roja (DN50 a 8 L/s).
2. Haz clic en esa tubería y pulsa **Aplicar DN sugerido por IA**: pasa a azul.
3. Arrastra nodos (ajustan a cuadrícula); usa **Tubería** para conectar dos nodos.
4. `Ctrl+K` → "Diseñar red para 4 sectores" o "Auditar presiones".

## Avance 70 % — novedades
- Zoom y pan del lienzo, deshacer/rehacer (Ctrl+Z / Ctrl+Y), ajuste a cuadrícula conmutable y barra de estado inferior.
- **Resumen de la red** en el Inspector (sin selección): métricas y tabla de tramos con velocidad; clic en una fila selecciona la tubería.
- Etiqueta "Cursor" en la paleta (antes se cortaba "Seleccionar").
