import { fireEvent, render, screen } from '@testing-library/react'
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

describe('HomePage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('shows the brand and disables continue without saved progress', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeInTheDocument()
    expect(screen.getByText('Automatize. Programe. Cultive.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar missão/ })).toBeDisabled()
    expect(screen.getByText('0 de 6 fases concluídas')).toBeInTheDocument()
  })

  it('starts a new farm at the training when there is no progress', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('continues at the next mission and shows its name', () => {
    useProgressStore.getState().recordAttempt(success('m0-training'))
    useProgressStore.getState().recordAttempt(success('m1-first-harvest'))
    renderHome()
    const continueButton = screen.getByRole('button', { name: /Continuar missão/ })
    expect(continueButton).toBeEnabled()
    expect(continueButton).toHaveTextContent('Fase 2 - Plantação em série')
    expect(screen.getByText('1 de 6 fases concluídas')).toBeInTheDocument()
  })

  it('asks before wiping progress when starting a new farm', () => {
    useProgressStore.getState().recordAttempt(success('m1-first-harvest'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    expect(screen.getByRole('dialog', { name: 'Começar uma nova fazenda?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Apagar e começar' }))
    expect(useProgressStore.getState().save.attempts).toHaveLength(0)
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })
})
