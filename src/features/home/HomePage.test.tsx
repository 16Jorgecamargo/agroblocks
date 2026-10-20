import { MISSIONS } from '@/data/missions'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { useProgressStore } from '@/stores/progressStore'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jogar/:missionId" element={<p>jogando</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const success = (missionId: string) => ({
  missionId,
  timestamp: '2026-10-14T12:00:00.000Z',
  outcome: 'success' as const,
  errorCode: null,
  actions: 3,
  blocks: 3,
  usage: { seeds: 0, water: 0, energy: 3 },
  efficiencyStars: 3 as const,
  pseudocode: '',
})

function register(name = 'Ana Souza', school = 'Escola Azul') {
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: name } })
  fireEvent.change(screen.getByLabelText('Escola'), { target: { value: school } })
  fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
}

describe('HomePage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('shows the brand and disables continue without saved progress', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeInTheDocument()
    expect(screen.getByText('Automatize. Programe. Cultive.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar missão/ })).toBeDisabled()
    expect(screen.getByText(`0 de ${MISSIONS.length - 1} fases concluídas`)).toBeInTheDocument()
  })

  it('continues at the next mission and shows its name', () => {
    useProgressStore.getState().recordAttempt(success('m0-training'))
    useProgressStore.getState().storeAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: {} })
    useProgressStore.getState().recordAttempt(success('garden-01'))
    renderHome()
    const continueButton = screen.getByRole('button', { name: /Continuar missão/ })
    expect(continueButton).toBeEnabled()
    expect(continueButton).toHaveTextContent('Fase 2 - Hora de plantar')
    expect(screen.getByText(`1 de ${MISSIONS.length - 1} fases concluídas`)).toBeInTheDocument()
  })

  it('asks who is playing before starting a new farm', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    expect(screen.getByRole('dialog', { name: 'Quem está jogando?' })).toBeInTheDocument()
    register()
    expect(screen.getByText('jogando')).toBeInTheDocument()
    expect(useProgressStore.getState().save.student).toEqual({ name: 'Ana Souza', school: 'Escola Azul' })
    expect(useProgressStore.getState().save.runId).not.toBeNull()
  })

  it('asks before wiping progress, then asks who is playing', () => {
    useProgressStore.getState().storeAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: {} })
    useProgressStore.getState().recordAttempt(success('garden-01'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar e começar' }))
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    expect(screen.getByRole('dialog', { name: 'Quem está jogando?' })).toBeInTheDocument()
    register()
    expect(useProgressStore.getState().save.attempts).toHaveLength(0)
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('keeps everything when the student cancels the registration', () => {
    useProgressStore.getState().storeAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: {} })
    useProgressStore.getState().recordAttempt(success('garden-01'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar e começar' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Quem está jogando?' })).getByRole('button', { name: 'Cancelar' }))
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    expect(screen.queryByText('jogando')).not.toBeInTheDocument()
  })

  it('registers an old save before continuing without losing progress', () => {
    useProgressStore.getState().recordAttempt(success('m0-training'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Continuar missão/ }))
    register()
    expect(screen.getByText('jogando')).toBeInTheDocument()
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    expect(useProgressStore.getState().save.student?.name).toBe('Ana Souza')
  })

  it('continues directly when the student is known', () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    useProgressStore.getState().recordAttempt(success('m0-training'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Continuar missão/ }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })
})
