import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ResultsPage } from '@/features/results/ResultsPage'
import { useProgressStore } from '@/stores/progressStore'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/resultado/:missionId" element={<ResultsPage />} />
        <Route path="/jogar/:missionId" element={<p>jogando</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResultsPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('redirects to the mission when there is no success yet', () => {
    renderAt('/resultado/garden-04')
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('shows real attempt data, separates correctness from efficiency and links forward', () => {
    useProgressStore.getState().recordAttempt({
      missionId: 'garden-04',
      timestamp: '2026-10-14T12:00:00.000Z',
      outcome: 'error',
      errorCode: 'HIT_OBSTACLE',
      actions: 2,
      blocks: 8,
      usage: { seeds: 0, water: 0, energy: 2 },
      efficiencyStars: null,
      pseudocode: '',
    })
    useProgressStore.getState().recordAttempt({
      missionId: 'garden-04',
      timestamp: '2026-10-14T12:01:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 12,
      blocks: 10,
      usage: { seeds: 0, water: 0, energy: 11 },
      efficiencyStars: 1,
      pseudocode: 'quando executar:\n    mover para frente',
    })
    renderAt('/resultado/garden-04')
    expect(screen.getByRole('heading', { name: 'Missão concluída!' })).toBeInTheDocument()
    expect(screen.getByLabelText('Comandos executados')).toHaveTextContent('12')
    expect(screen.getByLabelText('Tentativas')).toHaveTextContent('2')
    expect(screen.getByText('Solução correta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Eficiência 1 de 3' })).toBeInTheDocument()
    expect(screen.getByText('Sequenciamento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima missão' })).toHaveAttribute('href', '/jogar/garden-05')
    expect(screen.getByRole('link', { name: 'Tentar novamente' })).toHaveAttribute('href', '/jogar/garden-04')
    const actions = screen.getByRole('group', { name: 'Próximos passos' })
    expect([...actions.querySelectorAll('button, a')].map((item) => item.textContent?.trim())).toEqual(['Ver solução', 'Tentar novamente', 'Próxima missão'])
  })

  it('reveals how it works with the robot steps when asking to see the solution', async () => {
    useProgressStore.getState().recordAttempt({
      missionId: 'garden-04',
      timestamp: '2026-10-14T12:01:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 12,
      blocks: 10,
      usage: { seeds: 0, water: 0, energy: 11 },
      efficiencyStars: 1,
      pseudocode: 'quando executar:\n    mover para frente',
    })
    renderAt('/resultado/garden-04')
    expect(screen.queryByRole('heading', { name: 'Como funciona?' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver solução' }))
    expect(await screen.findByRole('heading', { name: 'Como funciona?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'O que o robô fez?' })).toBeInTheDocument()
    expect(screen.getByText('Dica')).toBeInTheDocument()
    const own = screen.getByText('O pseudocódigo que você fez para passar').closest('figure')
    expect(own).toHaveTextContent('mover para frente')
    const reference = screen.getByText('Solução da missão em pseudocódigo').closest('figure')
    expect(reference?.querySelector('pre')?.textContent).toMatch(/quando executar/)
  })
})
