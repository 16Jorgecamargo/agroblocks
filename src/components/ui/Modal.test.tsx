import { fireEvent, render, screen } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('renders an accessible dialog, focuses the first control and closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal title="Configurações" onClose={onClose}>
        <button type="button">Primeiro</button>
        <button type="button">Segundo</button>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Configurações' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('wraps focus with Tab', () => {
    render(
      <Modal title="Teste" onClose={() => undefined}>
        <button type="button">Último</button>
      </Modal>,
    )
    const last = screen.getByRole('button', { name: 'Último' })
    last.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })
})
