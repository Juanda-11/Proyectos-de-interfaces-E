/** Textos de la interfaz en español (idioma por defecto y respaldo de los demás). */
export default {
  // Componentes
  'type.tank': 'Tanque',
  'type.pump': 'Bomba',
  'type.valve': 'Válvula',
  'type.junction': 'Nodo',

  // Paleta de herramientas
  'tool.select': 'Cursor',
  'tool.pipe': 'Tubería',

  // Barra superior
  'topbar.fileName': 'Red_Distribución_01.hgraph',
  'topbar.warnings.one': '{count} advertencia',
  'topbar.warnings.other': '{count} advertencias',
  'topbar.stable': 'Red estable',
  'topbar.stableSimulating': 'Red estable · simulando',
  'topbar.offline': 'Modo local',
  'topbar.offlineTitle': 'Sin conexión con el servidor: solo se calculan velocidades',
  'topbar.undo': 'Deshacer (Ctrl+Z)',
  'topbar.redo': 'Rehacer (Ctrl+Y)',
  'topbar.balance': 'Caudales',
  'topbar.balanceTitle': 'Calcula los caudales de cada tramo a partir de las demandas de los nodos',
  'topbar.optimize': 'Optimizar',
  'topbar.optimizeTitle': 'Corrige diámetros y alturas de bomba automáticamente',
  'topbar.stop': 'Detener',
  'topbar.simulate': 'Simular Flujo',

  // Menú Archivo
  'file.menu': 'Archivo',
  'file.new': 'Nueva red de ejemplo',
  'file.import': 'Importar JSON…',
  'file.importLabel': 'Importar red desde archivo JSON',
  'file.exportJson': 'Exportar JSON',
  'file.exportSvg': 'Exportar imagen (SVG)',
  'file.exportPng': 'Exportar imagen (PNG)',
  'file.exportReport': 'Exportar informe (Markdown)',
  'file.exportEpanet': 'Exportar a EPANET (.inp)',

  // Avisos, leyenda y errores
  'toast.close': 'Cerrar aviso',
  'legend.title': 'Leyenda',
  'legend.velocity': 'Velocidad en tuberías',
  'legend.tier.ok': 'Normal (hasta 2 m/s)',
  'legend.tier.caution': 'Atención (2–2,5 m/s)',
  'legend.tier.warn': 'Excesiva (más de 2,5 m/s)',
  'legend.hint': 'Simula para colorear las tuberías por velocidad.',
  'error.title': 'Algo salió mal',
  'error.body':
    'La aplicación encontró un error inesperado. Puedes reintentar o, si persiste, reiniciar con la red de ejemplo (se borrará la copia guardada).',
  'error.details': 'Detalles técnicos',
  'error.retry': 'Reintentar',
  'error.reset': 'Reiniciar',

  // Copiloto
  'copilot.title': 'Copiloto IA',
  'copilot.inputLabel': 'Orden para el copiloto',
  'copilot.placeholder': 'Escribe una orden, p. ej. "Diseñar red para 3 sectores"',
  'copilot.close': 'Cerrar copiloto',
  'copilot.closeTitle': 'Cerrar (Esc)',
  'copilot.thinking': 'Copiloto analizando la red…',
  'copilot.failed': 'No pude completar la orden.',
  'copilot.sourceAi': 'IA',
  'copilot.sourceRules': 'reglas',
  'copilot.suggestion.design': 'Diseñar red para 3 sectores',
  'copilot.suggestion.audit': 'Auditar presiones de la red',

  // Lienzo
  'canvas.label': 'Lienzo de la red de agua',
  'canvas.pipeLabel': 'Tubería {from} a {to}, DN{dn}',
  'canvas.pipeWarn': ', velocidad excesiva',
  'canvas.nodeLabel': '{name}, {type}',
  'canvas.nodePressure': ', {p} metros de columna de agua',
  'canvas.empty':
    'El lienzo está vacío. Añade un tanque desde la paleta o pide una red al copiloto',
  'canvas.pickSecond': 'Elige el segundo componente',
  'canvas.pickTwo': 'Haz clic en dos componentes para conectarlos',
  'canvas.zoomIn': 'Acercar',
  'canvas.zoomOut': 'Alejar',
  'canvas.fit': 'Encuadrar toda la red',
  'canvas.grid': 'Mostrar cuadrícula',
  'canvas.snap': 'Ajuste a cuadrícula',
  'canvas.snapTitle': 'Imán: ajustar los nodos a la cuadrícula al moverlos',
  'canvas.fullscreen': 'Pantalla completa',
  'canvas.exitFullscreen': 'Salir de pantalla completa',

  // Cliente HTTP
  'api.timeout': 'El servidor tardó demasiado en responder',
  'api.network': 'No se pudo conectar con el servidor',
  'api.noApi':
    'No se encontró la API en esta dirección. Revisa que VITE_API_URL apunte al backend.',
  'api.httpError': 'Error {status} del servidor',

  // Inspector
  'unit.pressure': 'm.c.a.',
  'inspector.delete': 'Eliminar elemento seleccionado',
  'inspector.deleteTitle': 'Eliminar (Supr)',
  'inspector.components': 'Componentes',
  'inspector.pipes': 'Tuberías',
  'inspector.maxFlow': 'Caudal máx.',
  'inspector.minPressure': 'Presión mín.',
  'inspector.issues': 'Problemas detectados',
  'inspector.pipe': 'Tramo',
  'inspector.hint': 'Selecciona un tramo o componente para editar sus propiedades.',
  'inspector.hintSimulate': 'Pulsa «Simular Flujo» para calcular presiones y pérdidas.',
  'inspector.waterLevel': 'Nivel de agua',
  'inspector.pumpHead': 'Altura de bomba',
  'inspector.elevation': 'Cota',
  'inspector.demand': 'Demanda',
  'inspector.bottomPressure': 'Presión en fondo',
  'inspector.computedPressure': 'Presión calculada',
  'inspector.disconnected': 'Este componente no está conectado a ningún tanque.',
  'inspector.pipeTitle': 'Tubería',
  'inspector.diameter': 'Diámetro',
  'inspector.flow': 'Caudal',
  'inspector.velocity': 'Velocidad',
  'inspector.headLoss': 'Pérdida de carga',
  'inspector.length': 'Longitud',
  'inspector.velocityWarning': 'Velocidad excesiva: riesgo de sobrepresión y desgaste.',
  'inspector.applyDn': 'Aplicar DN{dn} sugerido por IA',

  // Lógica sin React
  'network.sector': 'Sector',
  'offline.designed':
    'Red generada sin conexión: 1 tanque, 1 bomba y {n} sectores con {pipes} tuberías. Pulsa "Simular Flujo" para verificar velocidades.',
  'offline.auditOk':
    'Auditoría local completa: velocidades dentro de rango. (Sin conexión no se calculan presiones.)',
  'offline.auditBad':
    'Detecté {n} tramo(s) con velocidad sobre 2.5 m/s ({ids}). Selecciónalo y aplica el diámetro sugerido (DN{dn}).',
  'offline.optimized': 'Ajusté {n} diámetro(s) sin conexión: {list}.',
  'offline.nothing': 'La red ya cumple los criterios de velocidad; no hay nada que optimizar.',
  'offline.help':
    'Puedo diseñar redes ("Diseñar red para 3 sectores") o auditarlas ("Auditar presiones").',
  'parse.format':
    'El archivo no tiene el formato de una red HydroGraph (faltan «nodes» o «pipes»).',
  'parse.tooLarge': 'La red es demasiado grande (máx. 200 nodos y 400 tuberías).',
  'parse.nodeNoId': 'Hay un nodo sin identificador.',
  'parse.unknownType': 'Tipo de componente desconocido: «{type}».',
  'parse.badCoords': 'El nodo {id} no tiene coordenadas válidas.',
  'parse.dupNode': 'Identificador de nodo repetido: {id}.',
  'parse.pipeNoId': 'Hay una tubería sin identificador o repetida.',
  'parse.pipeNodes': 'La tubería {id} conecta nodos inexistentes.',
  'parse.pipeValues': 'La tubería {id} tiene diámetro o caudal inválido.',
}
