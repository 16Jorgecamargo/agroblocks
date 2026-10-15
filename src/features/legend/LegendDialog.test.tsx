import { useState } from 'react'
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { LegendDialog } from '@/features/legend/LegendDialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Legenda
      </button>
      <LegendDialog open={open} onClose={() => setOpen(false)} use3d={false} reducedMotion />
    </>
  )
}

function openLegend() {
  render(<Harness />)
  const opener = screen.getByRole('button', { name: 'Legenda' })
  opener.focus()
  fireEvent.click(opener)
  return screen.getByRole('dialog', { name: 'Legenda' })
}

describe('LegendDialog', () => {
  it('opens on the empty soil page with one preview', () => {
    const dialog = openLegend()
    expect(dialog).toHaveClass('game-dialog--fixed')
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Vazio' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('1/10')).toBeInTheDocument()
    expect(document.querySelectorAll('.legend__preview')).toHaveLength(1)
  })

  it('navigates by side list, arrows and keyboard', () => {
    const dialog = openLegend()
    fireEvent.click(screen.getByRole('tab', { name: 'Pronto para colher' }))
    expect(screen.getByRole('heading', { name: 'Pronto para colher' })).toBeInTheDocument()
    expect(screen.getByText('colher planta')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByRole('heading', { name: 'Pedra' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByRole('heading', { name: 'Crescendo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Vazio' }))
    fireEvent.keyDown(dialog.querySelector('.legend__layout') as Element, { key: 'ArrowLeft' })
    expect(screen.getByRole('heading', { name: 'Canteiro do objetivo' })).toBeInTheDocument()
    fireEvent.keyDown(dialog.querySelector('.legend__layout') as Element, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument()
    expect(document.querySelectorAll('.legend__preview')).toHaveLength(1)
  })

  it('closes, returns focus to the legend button and reopens on the first page', async () => {
    openLegend()
    fireEvent.click(screen.getByRole('tab', { name: 'Molhado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.getByRole('button', { name: 'Legenda' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Legenda' }))
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument()
  })
})
