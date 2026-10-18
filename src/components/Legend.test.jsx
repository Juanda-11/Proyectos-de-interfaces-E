import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Legend from './Legend'

describe('Legend', () => {
  it('lista los tipos de componente', () => {
    render(<Legend running={false} />)
    for (const l of ['Tanque', 'Bomba', 'Válvula', 'Nodo'])
      expect(screen.getByText(l)).toBeInTheDocument()
  })
  it('sin simular invita a simular; simulando muestra los niveles de velocidad', () => {
    const { rerender } = render(<Legend running={false} />)
    expect(screen.getByText(/Simula para colorear/)).toBeInTheDocument()
    rerender(<Legend running />)
    expect(screen.getByLabelText('Velocidad en tuberías')).toHaveTextContent('Excesiva')
    expect(screen.queryByText(/Simula para colorear/)).not.toBeInTheDocument()
  })
})
