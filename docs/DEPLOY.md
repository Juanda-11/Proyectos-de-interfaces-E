# Despliegue en Vercel

El sistema se compone de **dos proyectos de Vercel** que se comunican por HTTPS:

```
Navegador ──► frontend (Vercel, estático)  ──VITE_API_URL──►  backend (Vercel, función serverless)
```

## Backend ([Proyectos-de-interfaces-EB](https://github.com/Juanda-11/Proyectos-de-interfaces-EB))

- Proyecto importado desde el repositorio; Vercel detecta Express y usa `src/index.js` como entrada. No hay paso de build.
- Variables de entorno:

  | Variable         | Valor                                                                                                                                |
  | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
  | `CORS_ORIGINS`   | URL exacta del frontend (`https://…`, sin barra final); varias, separadas por comas                                                  |
  | `GEMINI_API_KEY` | _(Opcional, gratuita)_ clave de [Google AI Studio](https://aistudio.google.com/apikey). Sin ella el copiloto usa el motor por reglas |

- Comprobación: `GET https://<backend>.vercel.app/api/health` responde `{"status":"ok", …}`.

## Frontend (este repositorio)

- Proyecto importado desde el repositorio; Vercel detecta Vite y [`vercel.json`](../vercel.json) fija el comando de instalación y las cabeceras de seguridad.
- Variable de entorno: `VITE_API_URL` = URL del backend, **sin barra final**. Se incorpora al compilar, por lo que cambiarla exige un nuevo despliegue.

## Orden de despliegue

1. Backend (con `CORS_ORIGINS` provisional).
2. Frontend, con `VITE_API_URL` apuntando al backend.
3. Actualizar `CORS_ORIGINS` del backend con la URL definitiva del frontend y volver a desplegarlo (las variables nuevas solo se aplican a despliegues nuevos).

## Verificación

| Comprobación                  | Resultado esperado                                                   |
| ----------------------------- | -------------------------------------------------------------------- |
| Abrir el frontend             | El pie de página indica _Servidor conectado_ y el motor del copiloto |
| _Simular Flujo_               | «1 advertencia» y la lista de problemas con el tramo J1→S3           |
| _Optimizar_                   | La red queda estable (DN50 → DN75)                                   |
| _Archivo → Exportar a EPANET_ | Se descarga `hydrograph-red.inp`                                     |
| Consola del navegador         | Sin errores de CORS                                                  |

## Diagnóstico

| Síntoma                                    | Causa probable                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Pie de página: _Sin servidor · modo local_ | `VITE_API_URL` ausente o incorrecta, o backend caído (revisar `/api/health`)                  |
| Error de CORS en la consola                | `CORS_ORIGINS` no coincide con la URL del frontend (protocolo y sin barra final)              |
| `429 Too Many Requests`                    | Límite de 60 peticiones por minuto y por IP (`RATE_LIMIT_MAX`)                                |
| El copiloto responde «reglas» con clave    | La variable no está en el entorno _Production_, falta redesplegar o se agotó el cupo gratuito |
| `npm ci` falla instalando Electron         | `vercel.json` define `ELECTRON_SKIP_BINARY_DOWNLOAD=1`; debe mantenerse                       |

## Prueba local con la API de producción

```bash
VITE_API_URL=https://<backend>.vercel.app npm run build && npm run preview
```
