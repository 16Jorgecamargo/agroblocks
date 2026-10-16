import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { useProgressStore } from '@/stores/progressStore'

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage token="t" onUnauthorized={vi.fn()} onLogout={vi.fn()} />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('states that data are local and shows an empty state without records', () => {
    renderPage()
    expect(screen.getByText(/Não constituem resultados de pesquisa/)).toBeInTheDocument()
    expect(screen.getByText('Ainda não existem registros neste navegador.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar tentativas/ })).toBeDisabled()
  })

  it('labels demo data clearly and never exports it', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Carregar dados de demonstração' }))
    expect(screen.getByText('DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar tentativas/ })).toBeDisabled()
    expect(useProgressStore.getState().save.attempts).toHaveLength(0)
  })

  it('shows real numbers from recorded attempts', () => {
    useProgressStore.getState().recordAttempt({
      missionId: 'm1-first-harvest',
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 8,
      blocks: 8,
      usage: { seeds: 0, water: 0, energy: 7 },
      efficiencyStars: 3,
      pseudocode: '',
    })
    renderPage()
    expect(screen.getByLabelText('Fases concluídas')).toHaveTextContent('1 de 6')
    const table = screen.getByRole('table', { name: 'Resultados por missão' })
    const row = within(table).getByRole('row', { name: /Primeira colheita/ })
    expect(row).toHaveTextContent('Concluída')
    expect(screen.getByRole('button', { name: /Exportar tentativas/ })).toBeEnabled()
  })
})
