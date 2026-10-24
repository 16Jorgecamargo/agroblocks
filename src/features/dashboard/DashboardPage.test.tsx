import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MISSIONS } from '@/data/missions'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { sortStudents } from '@/features/dashboard/ClassField'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function renderPage(onUnauthorized = vi.fn()) {
  render(
    <MemoryRouter>
      <DashboardPage token="t" onUnauthorized={onUnauthorized} onLogout={vi.fn()} />
    </MemoryRouter>,
  )
  return { onUnauthorized }
}

describe('DashboardPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the empty state when nobody sent data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: [] })))
    renderPage()
    expect(await screen.findByText('Nenhum aluno enviou dados ainda.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
  })

  it('lists students from the server with summary and tutorial column', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    const table = await screen.findByRole('table', { name: 'Alunos' })
    expect(within(table).getAllByRole('row')).toHaveLength(9)
    expect(screen.getByRole('group', { name: 'Alunos' })).toHaveTextContent('7')
    expect(within(table).getByRole('columnheader', { name: /Milharal/ })).toBeInTheDocument()
    const ana = within(table).getByText('Ana Souza').closest('tr') as HTMLElement
    expect(ana).toHaveTextContent('Tutorial: Concluído')
    expect(ana.querySelector('[data-col="garden"]')).toHaveTextContent('5/5')
    expect(ana.querySelector('[data-col="missions"]')).toHaveTextContent('30')
    const gabriela = within(table).getByText('Gabriela Nunes').closest('tr') as HTMLElement
    expect(gabriela.querySelector('[data-col="garden"]')).toHaveTextContent('1/5')
    expect(gabriela.querySelector('[data-col="homestead"]')).toHaveTextContent('0/5')
    expect(screen.getByRole('heading', { name: 'Prova inicial e prova final por mundo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tentativas e dicas por mundo' })).toBeInTheDocument()
  })

  it('filters by school and search', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    await screen.findByRole('table', { name: 'Alunos' })
    fireEvent.change(screen.getByLabelText('Escola'), { target: { value: 'Escola Técnica Agrícola' } })
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(4)
    fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: 'felipe' } })
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(9)
    fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: 'ninguém' } })
    expect(screen.getByText('Nenhum aluno nesses filtros.')).toBeInTheDocument()
  })

  it('sorts by a column when its header is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    const table = await screen.findByRole('table', { name: 'Alunos' })
    fireEvent.click(within(table).getByRole('button', { name: 'Aluno' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ana Souza')
    fireEvent.click(within(table).getByRole('button', { name: 'Aluno' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Gabriela Nunes')
  })

  it('sorts by completed missions in both directions', () => {
    const rows = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students
    expect(sortStudents(rows, 'completedMissions', 'asc')[0].name).toBe('Gabriela Nunes')
    expect(sortStudents(rows, 'completedMissions', 'desc')[0].name).toBe('Ana Souza')
  })

  it('switches to clearly labelled demo data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: [] })))
    renderPage()
    await screen.findByText('Nenhum aluno enviou dados ainda.')
    fireEvent.click(screen.getByRole('button', { name: 'Dados de exemplo' }))
    expect(screen.getByText('Você está vendo dados de exemplo, inventados. Eles não são resultado de nenhuma turma.')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Alunos' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apagar jogada' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar aos dados reais' }))
    expect(screen.getByText('Nenhum aluno enviou dados ainda.')).toBeInTheDocument()
  })

  it('switches between light and dark themes and remembers the choice', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: [] })))
    window.localStorage.removeItem('agroblocks:dashboard-theme:v1')
    const { container } = render(
      <MemoryRouter>
        <DashboardPage token="t" onUnauthorized={vi.fn()} onLogout={vi.fn()} />
      </MemoryRouter>,
    )
    const root = container.querySelector('.dash')
    expect(root).toHaveAttribute('data-theme', 'light')
    fireEvent.click(screen.getByRole('button', { name: 'Tema escuro' }))
    expect(root).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem('agroblocks:dashboard-theme:v1')).toBe('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Tema claro' }))
    expect(root).toHaveAttribute('data-theme', 'light')
  })

  it('asks for the password again when the token is refused', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'unauthorized' })))
    const { onUnauthorized } = renderPage()
    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1))
  })

  it('offers a retry when the server is unreachable', async () => {
    const fetchMock = vi.fn(async () => Promise.reject(new TypeError('offline')))
    vi.stubGlobal('fetch', fetchMock)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('opens a student and deletes one of their runs on the server', async () => {
    const runs = createDemoRuns(MISSIONS)
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => (init?.method === 'DELETE' ? new Response(null, { status: 204 }) : json(200, { runs })))
    vi.stubGlobal('fetch', fetchMock)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalhes de Felipe Costa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar jogada' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => init?.method === 'DELETE' && String(url).includes('demo-run-5-0'))).toBe(true))
  })
})
