# Arquitectura del frontend

## Principios

1. **El backend calcula, la interfaz presenta.** Presiones, pérdidas de carga y el copiloto viven en el backend; el frontend solo conserva el cálculo de velocidades (`lib/hydraulics.js`) para poder trabajar sin conexión.
2. **Degradación elegante.** Cada llamada al backend tiene un respaldo local. Solo los errores de red y de tiempo (`NETWORK`, `TIMEOUT`) activan el modo local; los errores de validación (`400`) se muestran al usuario.
3. **Estado en hooks pequeños y probados**, con `App.jsx` como único lugar donde se combinan.

## Flujo de datos

```
App ── useNetworkHistory ── red (nodos, tuberías) + deshacer/rehacer
 │
 ├── useSimulation(net) ── POST /api/simulate (con retardo de 250 ms al editar)
 │        └── statusOfPipe / pipeResult / nodeResult → Canvas e Inspector
 ├── useBackendStatus ── GET /api/health cada 60 s → pie de página
 ├── useToasts ── avisos
 └── acciones: optimizar, copiloto, importar/exportar
```

### Historial

`checkpoint()` guarda el estado actual **una vez por gesto** (un arrastre completo, una pulsación de slider) y `update(fn)` modifica la red sin crear puntos. Así un arrastre de 200 fotogramas es un solo paso de deshacer. El historial guarda hasta 50 pasos.

### Simulación

Mientras la simulación está activa, cada cambio de la red reinicia un temporizador de 250 ms y llama a `/api/simulate`. Las respuestas obsoletas se descartan. Si el servidor no responde:

- `status` pasa a `offline`, se avisa **una sola vez** y la interfaz usa `pipeStatus` local.
- Al volver la conexión, el siguiente cambio vuelve a simular en el backend.

### Copiloto

`Copilot` solo conoce `onSubmit(orden) → Promise<{message, source}>`. `App.askCopilot` llama a `/api/copilot` enviando la red actual; según la intención devuelta reemplaza la red (diseño) o inicia la simulación (auditoría). Toda red recibida se valida con `parseNetwork` antes de usarse.

## Validación de datos externos

`lib/parseNetwork.js` valida cualquier red que entra (archivo importado, `localStorage`, respuesta del backend): tipos, coordenadas, ids únicos, extremos existentes y rangos. Una red dañada nunca llega al estado de la aplicación.

## Idioma y tema

- **Idioma:** `src/i18n` contiene los diccionarios `es.js` y `en.js` y una función `translate(clave, parámetros)` con plurales (`clave.one` / `clave.other`). El idioma activo vive en el módulo para que también lo usen el cliente HTTP, el informe o la validación; `I18nProvider` lo mantiene sincronizado y repinta la interfaz. Una prueba comprueba que ambos diccionarios tienen las mismas claves y parámetros.
- **Servidor:** el cliente envía `Accept-Language` y el backend responde en ese idioma (problemas, sugerencias, copiloto y errores).
- **Tema:** la paleta son variables CSS (`--c-*`) que Tailwind consume como colores; `data-theme="light"` en `<html>` cambia sus valores. El lienzo SVG usa variables `--cv-*`. Un script en `index.html` aplica tema e idioma guardados antes de pintar para evitar parpadeos. El diagrama exportado (SVG/PNG) sigue el tema activo.

## Autenticación

- **Backend:** contraseñas con scrypt, sesiones JWT (HS256) y todas las rutas de cálculo protegidas con `Authorization: Bearer`. Los usuarios se guardan en Upstash Redis (o en memoria en desarrollo); la cuenta de demostración no necesita almacenamiento.
- **`auth/session.js`** guarda el token y avisa al resto de la app cuando una petición protegida recibe 401; lo usa también el cliente HTTP, que fuera de React no tiene acceso al contexto.
- **`auth/AuthProvider.jsx`** es una pequeña máquina de estados (`loading → anonymous | authenticated | open | local`). Al arrancar consulta `/api/health` (para saber si hay login, registro y cuenta demo) y valida el token con `/api/auth/me`; sin conexión acepta un token guardado mientras no haya caducado (se lee sin verificar la firma, solo para mostrar el nombre: la verificación real la hace siempre el servidor).
- **`AuthGate`** decide qué se ve: indicador de carga, pantalla de acceso o la aplicación. Al cerrar sesión la aplicación se desmonta, por lo que no queda estado de la cuenta anterior.
- **Datos por cuenta:** la red guardada en el navegador usa el id de usuario en su clave, de modo que en un equipo compartido cada persona ve solo su trabajo.
- **Decisión:** el token se guarda en `localStorage` (válido para web y Electron, sin cookies ni CORS con credenciales). El riesgo es el robo por XSS; se mitiga con cabeceras de seguridad, sin HTML inyectado y caducidad de 7 días.

## Accesibilidad

- Nodos y tuberías del SVG son `role="button"` enfocables, con nombre accesible (`Sector 3, nodo, 13.3 metros…`).
- Teclado: Enter/Espacio seleccionan, flechas mueven nodos, `Esc` cancela.
- Avisos con `aria-live`; los errores usan `role="alert"`.
- `prefers-reduced-motion` desactiva las animaciones.

## Decisiones

| Decisión                         | Motivo                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind 3 en vez de 4           | Evitar una migración de toda la configuración de diseño con riesgo visual; las dependencias señaladas son solo de compilación y no se publican |
| React 18                         | Versión con la que se desarrolló el prototipo; sin necesidad de migrar                                                                         |
| `localStorage` para autoguardado | Sin cuentas ni base de datos: el alcance del proyecto es un editor personal                                                                    |
| SVG propio para exportar         | El SVG del lienzo depende de clases CSS; el exportado es autónomo y se ve igual en cualquier visor                                             |
