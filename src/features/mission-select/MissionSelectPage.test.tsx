import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MissionSelectPage } from '@/features/mission-select/MissionSelectPage'
import { useProgressStore } from '@/stores/progressStore'

vi.mock('@/render/hasWebGL', () => ({ hasWebGL: () => false }))

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

function storeGardenPre() {
  useProgressStore.getState().storeAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: {} })
}

describe('MissionSelectPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('opens on the current world with its trail', () => {
    renderPage()
    expect(screen.getByText('Mundo 1: Horta')).toBeInTheDocument()
    expect(screen.getByText('Sequência · 0 de 10 missões')).toBeInTheDocument()
    const trail = screen.getByRole('list', { name: 'Trilha de Horta' })
    expect(within(trail).getAllByRole('listitem')).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Mundo anterior' })).toBeDisabled()
  })

  it('walks to the next world with the side buttons and shows the lock', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mundo' }))
    expect(screen.getByText('Mundo 2: Milharal')).toBeInTheDocument()
    expect(screen.getByText('Conclua o mundo Horta para abrir este')).toBeInTheDocument()
  })

  it('shows one dot per world and jumps to it', () => {
    renderPage()
    const dots = screen.getByRole('group', { name: 'Mundos' })
    expect(within(dots).getAllByRole('button')).toHaveLength(6)
    expect(within(dots).getByRole('button', { name: 'Horta: em andamento' })).toHaveAttribute('aria-current', 'true')
    fireEvent.click(within(dots).getByRole('button', { name: 'Fazenda completa: fechado' }))
    expect(screen.getByText('Mundo 6: Fazenda completa')).toBeInTheDocument()
  })

  it('starts the world with its pre-test', () => {
    renderPage()
    const card = screen.getByRole('region', { name: 'Prova inicial' })
    expect(within(card).getByRole('link', { name: 'Fazer a prova' })).toHaveAttribute('href', '/avaliacao/garden/pre')
  })

  it('shows the role of a mission and plays it', () => {
    storeGardenPre()
    renderPage()
    const card = screen.getByRole('region', { name: 'Missão 1 - Primeiros passos' })
    expect(within(card).getByText('Conhecer')).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Jogar' }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('disables locked missions', async () => {
    storeGardenPre()
    renderPage()
    fireEvent.click(within(screen.getByRole('list', { name: 'Trilha de Horta' })).getByRole('button', { name: /^Missão 2 · Hora de plantar/ }))
    const card = await screen.findByRole('region', { name: 'Missão 2 - Hora de plantar' })
    expect(within(card).getByRole('button', { name: 'Jogar' })).toBeDisabled()
  })
})
