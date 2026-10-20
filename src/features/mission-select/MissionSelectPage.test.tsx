import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MissionSelectPage } from '@/features/mission-select/MissionSelectPage'
import { useProgressStore } from '@/stores/progressStore'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/missoes']}>
      <Routes>
        <Route path="/missoes" element={<MissionSelectPage />} />
        <Route path="/jogar/:missionId" element={<p>jogando</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MissionSelectPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('lists every mission with a textual status', () => {
    renderPage()
    const list = screen.getByRole('list', { name: 'Lista de fases' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(7)
    expect(within(list).getByRole('button', { name: /Fase 4 · Primeira colheita · Disponível/ })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: /Fase 12 · Plantação em série · Bloqueada/ })).toBeInTheDocument()
  })

  it('shows details and starts an available mission', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Fase 4 · Primeira colheita/ }))
    const card = await screen.findByRole('region', { name: 'Fase 4 - Primeira colheita' })
    expect(within(card).getByText('Sequenciamento')).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Iniciar fase' }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('explains locked missions and disables the start button', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Fase 24 · Irrigação inteligente/ }))
    const card = await screen.findByRole('region', { name: 'Fase 24 - Irrigação inteligente' })
    expect(within(card).getByRole('button', { name: 'Iniciar fase' })).toBeDisabled()
    expect(within(card).getByText('Conclua a fase 23 para desbloquear.')).toBeInTheDocument()
  })
})
