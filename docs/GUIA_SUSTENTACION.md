# Guía de sustentación · HydroGraph AI

## 1. ¿De qué trata? (30 segundos)

**HydroGraph AI** es un editor visual para **diseñar, simular y auditar redes de suministro de agua**. El usuario dibuja tanques, bombas, válvulas y tuberías; el sistema calcula velocidades, pérdidas de carga y presiones, avisa de los problemas y propone correcciones. Un **copiloto de IA** permite pedir en lenguaje natural «diseña una red para 4 sectores» o «audita las presiones».

## 2. Problema y usuarios

- **Problema:** las herramientas profesionales (p. ej. EPANET) son potentes pero poco intuitivas para estudiantes y técnicos que solo quieren esbozar y comprobar una red.
- **Usuarios:** estudiantes de ingeniería, técnicos de acueductos y diseñadores que necesitan un primer diseño rápido y comprensible.

## 3. Qué hace

1. **Dibujar** la red arrastrando componentes (cuadrícula, zoom, deshacer/rehacer, teclado).
2. **Simular**: velocidad, pérdida de carga (Hazen-Williams) y presión en cada nodo, con colores por nivel de velocidad.
3. **Detectar problemas** y llevar al elemento afectado, con la sugerencia concreta (p. ej. «usa DN75»).
4. **Optimizar** con un clic y **calcular caudales** a partir de las demandas.
5. **Copiloto IA** (Gemini o Claude, con respaldo por reglas si la IA no responde).
6. **Exportar**: EPANET (.inp), JSON, imagen SVG/PNG e informe técnico en Markdown.
7. **Idioma** español/inglés y **tema** claro/oscuro.

## 4. Cómo está hecho

| Capa       | Tecnología                                                                                 | Repositorio                  |
| ---------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS, SVG                                                          | `Proyectos-de-interfaces-E`  |
| Backend    | Node.js, Express, zod                                                                      | `Proyectos-de-interfaces-EB` |
| IA         | Gemini (nivel gratuito) o Claude, validados por el backend                                 | —                            |
| Despliegue | Vercel (dos proyectos)                                                                     | —                            |
| Calidad    | Pruebas automáticas (Vitest, Testing Library, Supertest), ESLint, Prettier, GitHub Actions | —                            |

**Idea clave de la IA:** el modelo **no inventa la red**. Interpreta la petición (número de sectores, demanda) y el backend construye la red con fórmulas hidráulicas, así el resultado siempre es válido. Si la IA falla, responde un motor por reglas y la app nunca se queda sin respuesta.

## 5. Decisiones de diseño de interfaces

| Heurística de usabilidad           | Cómo se aplica                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Visibilidad del estado del sistema | Indicador de red estable/advertencias, spinners, estado del servidor en el pie                                 |
| Correspondencia con el mundo real  | Iconos de tanque/bomba/válvula, azul = agua, naranja/rojo = riesgo                                             |
| Control y libertad del usuario     | Deshacer/rehacer (50 pasos), Esc, importar/exportar                                                            |
| Consistencia y estándares          | Atajos habituales (Ctrl+Z, Ctrl+K, Supr), mismos colores para el mismo significado                             |
| Prevención de errores              | Validación de archivos importados, rangos en controles deslizantes                                             |
| Reconocer antes que recordar       | Leyenda, etiquetas visibles, sugerencias del copiloto                                                          |
| Flexibilidad y eficiencia          | Teclado, copiloto, optimización de un clic                                                                     |
| Ayuda ante errores                 | Mensajes claros y modo local cuando no hay servidor                                                            |
| Accesibilidad                      | Navegación por teclado, etiquetas ARIA, foco visible, tema claro/oscuro, `prefers-reduced-motion`, dos idiomas |

## 6. Demostración sugerida (4 minutos)

1. Abrir la app y presentar la red de ejemplo (tanque → bomba → nodo → 3 sectores).
2. **Simular Flujo**: aparece la advertencia; el tramo J1→S3 se pone naranja (4,07 m/s).
3. Pulsar el problema → inspector con la sugerencia → **Optimizar**: la red queda estable.
4. **Copiloto** (`Ctrl+K`): «Diseñar red para 4 sectores» y luego «Auditar presiones».
5. **Caudales**: cambiar la demanda de un sector y calcular los caudales.
6. **Archivo → Exportar a EPANET / informe / imagen**.
7. Cambiar **tema** e **idioma** (se traduce también la respuesta del servidor).

## 7. Preguntas probables

- **¿Qué tan exacto es el cálculo?** Usa Hazen-Williams y propagación de alturas piezométricas desde los tanques; es adecuado para esbozos y redes ramificadas. Para estudios formales se exporta a EPANET (el archivo exportado se verificó simulándolo con WNTR).
- **¿Por qué dos repositorios?** Separar interfaz y lógica permite desplegarlos, probarlos y evolucionarlos por separado; el frontend sigue funcionando en modo local si el backend no responde.
- **¿Qué pasa si falla la IA o se agota el cupo gratuito?** El backend valida la respuesta del modelo y, ante cualquier fallo, usa el motor por reglas.
- **¿Cómo se garantiza la calidad?** Más de 300 pruebas automáticas entre ambos repositorios, validación de entradas en el backend y CI en cada cambio.
- **¿Qué se podría mejorar?** Redes malladas (resolver el sistema de ecuaciones), tiempos extendidos con consumo variable, guardado en la nube y colaboración.

## 8. Limitaciones conocidas

- Los caudales los define el usuario o se calculan en redes en árbol; en anillos se conservan los valores introducidos.
- No modela consumo variable en el tiempo ni curvas reales de bombas.
- El guardado es local al navegador (sin cuentas).
