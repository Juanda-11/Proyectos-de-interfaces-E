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
}
