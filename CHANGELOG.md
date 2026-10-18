# Changelog

## 1.0.0

Primera versión de entrega. Frontend separado del backend.

### Añadido
- Conexión con el backend: simulación (presiones, pérdidas de carga), copiloto, optimización y exportación a EPANET.
- Lista de problemas con navegación al elemento afectado; presión y velocidad visibles en el lienzo.
- Importar JSON, exportar JSON, EPANET, SVG y PNG.
- Guardado automático, modo sin conexión y estado del servidor en el pie de página.
- Accesibilidad por teclado en el lienzo, etiquetas ARIA y foco visible.
- Avisos (toasts), `ErrorBoundary` y metadatos/favicon.
- Pruebas (Vitest + Testing Library), ESLint, Prettier y CI.
- Configuración de Vercel.

### Cambiado
- El proyecto pasa de `hydrograph-ai/` a la raíz del repositorio.
- Estado dividido en hooks (`useNetworkHistory`, `useSimulation`, …) y `data.js` en módulos de `lib/`.
- Vite 7, plugin de React 5 y Electron actualizados.

### Corregido
- Borrar con `Retroceso` mientras se editaba un campo o se movía un slider eliminaba el elemento seleccionado.
- La etiqueta «Nódulo» ahora es «Nodo».
- Identificadores de nodos y tuberías con colisiones aleatorias poco probables pero posibles.
- Efectos y lecturas de refs durante el render señalados por las reglas de React.

## 0.7.0

Prototipo (avance 70 %): lienzo con zoom/pan, deshacer/rehacer, resumen de la red y copiloto simulado.
