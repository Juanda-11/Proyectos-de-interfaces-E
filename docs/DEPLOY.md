# Guía de despliegue en Vercel (frontend + backend)

El sistema son **dos proyectos de Vercel** que se comunican por HTTPS:

```
Navegador ──► frontend (Vercel, estático)  ──VITE_API_URL──►  backend (Vercel, función serverless)
```

## 1. Backend ([Proyectos-de-interfaces-EB](https://github.com/Juanda-11/Proyectos-de-interfaces-EB))

1. Vercel → **Add New → Project** → importa el repositorio del backend. Preset: _Other_. No hay comando de build.
2. Variables de entorno (_Settings → Environment Variables_):

   | Variable         | Valor                                                                                                                                                         |
   | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `CORS_ORIGINS`   | La URL del frontend, p. ej. `https://hydrograph-ai.vercel.app` (varias separadas por comas). Se completa en el paso 3                                         |
   | `GEMINI_API_KEY` | _(Opcional, gratuita)_ clave de [Google AI Studio](https://aistudio.google.com/apikey) para que el copiloto use Gemini. Sin ella funciona el motor por reglas |

3. Despliega y comprueba `https://<backend>.vercel.app/api/health`: debe responder `{"status":"ok", ...}`.

## 2. Frontend (este repositorio)

1. Vercel → **Add New → Project** → importa este repositorio. Vercel detecta Vite.
2. Variable de entorno: `VITE_API_URL` = URL del backend **sin barra final**.
3. Despliega.

> `VITE_API_URL` se incorpora al compilar: si la cambias, hay que **redesplegar** el frontend.

## 3. Cerrar el círculo

Copia la URL final del frontend en `CORS_ORIGINS` del backend y **redespliega el backend** (las variables nuevas solo aplican a despliegues nuevos).

## 4. Verificación

| Comprobación                  | Resultado esperado                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Abrir el frontend             | El pie de página dice _Servidor conectado · copiloto por reglas_ (o _IA claude-…_) |
| Pulsar _Simular Flujo_        | Aparece «1 advertencia» y la lista de problemas con el tramo J1→S3                 |
| _Optimizar_                   | La red queda estable (DN50 → DN75)                                                 |
| _Archivo → Exportar a EPANET_ | Se descarga `hydrograph-red.inp`                                                   |
| Consola del navegador         | Sin errores de CORS                                                                |

## Problemas frecuentes

| Síntoma                                           | Causa y solución                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pie de página: _Sin servidor · modo local_        | `VITE_API_URL` mal definida o backend caído. Revisa la URL y `/api/health`              |
| Error de CORS en la consola                       | `CORS_ORIGINS` no incluye la URL exacta del frontend (con `https://` y sin barra final) |
| `429 Too Many Requests`                           | Límite de 60 peticiones/minuto por IP; sube `RATE_LIMIT_MAX` si hace falta              |
| El copiloto dice «reglas» aunque pusiste la clave | La variable no existe en el entorno _Production_ o falta redesplegar                    |
| `npm ci` tarda o falla instalando Electron        | `vercel.json` ya define `ELECTRON_SKIP_BINARY_DOWNLOAD=1`; no lo quites                 |

## Desarrollo con la URL de producción

```bash
VITE_API_URL=https://<backend>.vercel.app npm run build && npm run preview
```
