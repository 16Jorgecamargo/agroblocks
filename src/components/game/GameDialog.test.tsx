import { useState } from 'react'
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { GameDialog, DialogSection } from '@/components/game/GameDialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <GameDialog open={open} title="Configurações" icon="gear" tone="info" onClose={() => setOpen(false)}>
        <DialogSection>
          <button type="button">Primeiro</button>
        </DialogSection>
        <DialogSection>
          <button type="button">Último</button>
        </DialogSection>
      </GameDialog>
    </>
  )
}

describe('GameDialog', () => {
  it('opens as an accessible game panel and focuses the close button', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialog = screen.getByRole('dialog', { name: 'Configurações' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveClass('game-dialog--info')
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })

  it('wraps focus with Tab', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    screen.getByRole('button', { name: 'Último' }).focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  })

  it('closes on Escape, leaves the DOM after the exit animation and returns focus', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'), { timeout: 2000 })
    expect(opener).toHaveFocus()
  })
})
