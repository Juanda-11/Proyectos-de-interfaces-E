# Versión de escritorio

La aplicación se empaqueta con **Electron** y **electron-builder**: la misma interfaz web, dentro de una ventana nativa, con instaladores para Windows, macOS y Linux. (El formato APK corresponde a Android; en escritorio los equivalentes son `.exe`, `.dmg`, `.AppImage` y `.deb`.)

## Cómo se obtienen los instaladores

### Opción A · GitHub Actions (los tres sistemas, sin instalar nada)

1. En el repositorio: **Actions → Desktop → Run workflow**.
2. Al terminar (unos 10 minutos), la ejecución contiene tres artefactos descargables:

   | Artefacto               | Contenido                                                   |
   | ----------------------- | ----------------------------------------------------------- |
   | `hydrograph-ai-windows` | Instalador `…-win-x64.exe` (NSIS) y versión portable        |
   | `hydrograph-ai-macos`   | `…-mac-x64.dmg` y `…-mac-arm64.dmg` (Intel y Apple Silicon) |
   | `hydrograph-ai-linux`   | `…-linux-x86_64.AppImage` y `…-linux-amd64.deb`             |

3. Para publicarlos en una **Release**, se crea una etiqueta de versión: `git tag v1.0.0 && git push origin v1.0.0`. El mismo workflow adjunta los instaladores a la Release.

### Opción B · En el propio equipo

Requiere Node 20 o superior. Cada sistema genera sus propios instaladores:

```bash
npm ci
npm run desktop:win     # en Windows → release/*.exe
npm run desktop:mac     # en macOS   → release/*.dmg
npm run desktop:linux   # en Linux   → release/*.AppImage y *.deb
npm run desktop:dir     # carpeta sin empaquetar, útil para probar rápido
```

Los resultados quedan en `release/` (ignorada por Git).

## Cómo funciona

- `npm run build:desktop` compila con `--mode desktop`, que lee [`.env.desktop`](../.env.desktop): ahí está la URL del backend desplegado. La ventana carga archivos locales (`file://`), por lo que necesita la dirección absoluta de la API.
- [`electron/main.js`](../electron/main.js) abre la ventana y añade las cabeceras CORS **solo a las respuestas de `/api/*`**: el backend únicamente admite los orígenes de la web y el origen de un archivo local es «null». No se modifica el backend ni se abre el resto de la web.
- Mantiene una sola instancia, abre los enlaces externos en el navegador y oculta el menú por defecto.
- Si el backend no responde, la aplicación sigue funcionando en modo local (velocidades), igual que en la web.
- El icono se genera a partir del logotipo y está en `build/icon.png` (1024 px).
- La configuración del empaquetado está en la clave `build` de [`package.json`](../package.json).

## Avisos de seguridad del sistema operativo

Los instaladores **no están firmados** (la firma requiere certificados de pago):

- **Windows:** SmartScreen puede mostrar «Windows protegió su PC». Se continúa con _Más información → Ejecutar de todas formas_.
- **macOS:** Gatekeeper bloquea la primera apertura. Clic derecho sobre la aplicación → _Abrir_, o _Ajustes del Sistema → Privacidad y seguridad → Abrir de todos modos_.
- **Linux:** el `.AppImage` necesita permiso de ejecución (`chmod +x HydroGraph-AI-*.AppImage`); el `.deb` se instala con `sudo apt install ./HydroGraph-AI-*.deb`.

## Desarrollo

```bash
npm run electron:dev   # Vite + ventana de Electron con recarga en vivo
```
