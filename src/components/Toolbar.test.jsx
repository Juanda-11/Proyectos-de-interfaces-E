import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from './Toolbar'

describe('Toolbar', () => {
  it('lista las herramientas y resalta la activa', () => {
    render(<Toolbar tool="pipe" onTool={() => {}} onAdd={() => {}} />)
    for (const l of ['Cursor', 'Tanque', 'Bomba', 'Válvula', 'Tubería', 'Nodo'])
      expect(screen.getByTitle(l)).toBeInTheDocument()
    expect(screen.getByTitle('Tubería').className).toContain('bg-water')
    expect(screen.getByTitle('Cursor').className).not.toContain('bg-water')
  })
  it('cursor y tubería cambian de herramienta; el resto añade componentes', async () => {
    const onTool = vi.fn(),
      onAdd = vi.fn()
    render(<Toolbar tool="select" onTool={onTool} onAdd={onAdd} />)
    await userEvent.click(screen.getByTitle('Tubería'))
    await userEvent.click(screen.getByTitle('Bomba'))
    expect(onTool).toHaveBeenCalledWith('pipe')
    expect(onAdd).toHaveBeenCalledWith('pump')
  })
})
