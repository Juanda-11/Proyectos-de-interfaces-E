import { useCallback, useReducer } from 'react'

const LIMIT = 50

/**
 * Estado de la red con historial de deshacer/rehacer.
 * - `checkpoint` guarda el estado actual antes de un cambio (una sola vez por gesto,
 *   p. ej. un arrastre completo).
 * - `update` modifica la red sin crear un punto de historial.
 */
function reducer(state, action) {
  switch (action.type) {
    case 'checkpoint':
      return { ...state, past: [...state.past.slice(-(LIMIT - 1)), state.net], future: [] }
    case 'update':
      return { ...state, net: action.fn(state.net) }
    case 'replace':
      return action.record
        ? { net: action.net, past: [...state.past.slice(-(LIMIT - 1)), state.net], future: [] }
        : { net: action.net, past: [], future: [] }
    case 'undo':
      if (!state.past.length) return state
      return { net: state.past.at(-1), past: state.past.slice(0, -1), future: [state.net, ...state.future] }
    case 'redo':
      if (!state.future.length) return state
      return { net: state.future[0], past: [...state.past, state.net], future: state.future.slice(1) }
    default:
      return state
  }
}

export function useNetworkHistory(initial) {
  const [state, dispatch] = useReducer(reducer, null, () => ({ net: typeof initial === 'function' ? initial() : initial, past: [], future: [] }))
  return {
    net: state.net,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    checkpoint: useCallback(() => dispatch({ type: 'checkpoint' }), []),
    update: useCallback((fn) => dispatch({ type: 'update', fn }), []),
    replace: useCallback((net, { record = true } = {}) => dispatch({ type: 'replace', net, record }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
  }
}
