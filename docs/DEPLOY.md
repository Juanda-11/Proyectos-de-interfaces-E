# Despliegue en Vercel

El sistema se compone de **dos proyectos de Vercel** que se comunican por HTTPS:

```
Navegador ──► frontend (Vercel, estático)  ──VITE_API_URL──►  backend (Vercel, función serverless)
```

## Backend ([Proyectos-de-interfaces-EB](https://github.com/Juanda-11/Proyectos-de-interfaces-EB))

- Proyecto importado desde el repositorio; Vercel detecta Express y usa `src/index.js` como entrada. No hay paso de build.
- Variables de entorno:

  | Variable         | Valor                                                                                                                                                                                                                                       |
  | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `CORS_ORIGINS`   | URL exacta del frontend (`https://…`, sin barra final); varias, separadas por comas                                                                                                                                                         |
  | `AUTH_SECRET`    | **Obligatorio.** Texto aleatorio de al menos 32 caracteres con el que se firman las sesiones. Se genera con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Sin él, la API responde 503 y el acceso no funciona |
  | `GEMINI_API_KEY` | _(Opcional, gratuita)_ clave de [Google AI Studio](https://aistudio.google.com/apikey). Sin ella el copiloto usa el motor por reglas                                                                                                        |

- Comprobación: `GET https://<backend>.vercel.app/api/health` responde `{"status":"ok", …, "auth": {"enabled": true, "configured": true, …}}`. Si `configured` es `false`, falta `AUTH_SECRET`.

### Acceso y cuentas

- **Cuenta de demostración** (siempre disponible, sin base de datos): `demo@hydrograph.ai` / `Hydro2026!`. Se puede cambiar con `DEMO_EMAIL` y `DEMO_PASSWORD`, ocultar en la pantalla de acceso con `DEMO_HINT=false` o desactivar con `DEMO_ENABLED=false`.
- **Registro de cuentas** (opcional): las funciones de Vercel no conservan archivos ni memoria entre invocaciones, por lo que los usuarios se guardan en una base de datos **Upstash Redis** (nivel gratuito, también desde _Storage_ o el _Marketplace_ de Vercel). Al conectarla se definen `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (o `KV_REST_API_URL` y `KV_REST_API_TOKEN`) y el registro se habilita solo. Sin ella, en producción el registro está desactivado y la pantalla de acceso lo indica.

## Frontend (este repositorio)

- Proyecto importado desde el repositorio; Vercel detecta Vite y [`vercel.json`](../vercel.json) fija el comando de instalación y las cabeceras de seguridad.
- Variable de entorno: `VITE_API_URL` = URL del backend, **sin barra final**. Se incorpora al compilar, por lo que cambiarla exige un nuevo despliegue.

## Orden de despliegue

1. Backend (con `CORS_ORIGINS` provisional).
2. Frontend, con `VITE_API_URL` apuntando al backend.
3. Actualizar `CORS_ORIGINS` del backend con la URL definitiva del frontend y volver a desplegarlo (las variables nuevas solo se aplican a despliegues nuevos).

## Verificación

| Comprobación                  | Resultado esperado                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| Abrir el frontend             | Aparece la pantalla de acceso; con la cuenta de demostración se entra a la aplicación |
| Pie de página                 | Indica _Servidor conectado_ y el motor del copiloto                                   |
| _Simular Flujo_               | «1 advertencia» y la lista de problemas con el tramo J1→S3                            |
| _Optimizar_                   | La red queda estable (DN50 → DN75)                                                    |
| _Archivo → Exportar a EPANET_ | Se descarga `hydrograph-red.inp`                                                      |
| Consola del navegador         | Sin errores de CORS                                                                   |

## Diagnóstico

| Síntoma                                         | Causa probable                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Pie de página: _Sin servidor · modo local_      | `VITE_API_URL` ausente o incorrecta, o backend caído (revisar `/api/health`)                  |
| Error de CORS en la consola                     | `CORS_ORIGINS` no coincide con la URL del frontend (protocolo y sin barra final)              |
| Pantalla de acceso con «No se pudo conectar»    | `VITE_API_URL` ausente o incorrecta, o backend caído; se puede entrar en modo local           |
| `503` al iniciar sesión (`AUTH_NOT_CONFIGURED`) | Falta `AUTH_SECRET` en el backend (o tiene menos de 32 caracteres)                            |
| «El registro de cuentas no está disponible»     | Falta conectar la base de datos Upstash Redis; la cuenta de demostración sigue funcionando    |
| `429 Too Many Requests`                         | Límite de 60 peticiones por minuto y por IP (`RATE_LIMIT_MAX`)                                |
| El copiloto responde «reglas» con clave         | La variable no está en el entorno _Production_, falta redesplegar o se agotó el cupo gratuito |
| `npm ci` falla instalando Electron              | `vercel.json` define `ELECTRON_SKIP_BINARY_DOWNLOAD=1`; debe mantenerse                       |

## Prueba local con la API de producción

```bash
VITE_API_URL=https://<backend>.vercel.app npm run build && npm run preview
```
