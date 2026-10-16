import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MISSIONS } from '@/data/missions'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { sortStudents } from '@/features/dashboard/StudentTable'

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
    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(screen.getByRole('group', { name: 'Alunos' })).toHaveTextContent('7')
    expect(within(table).getByText('Ana Souza').closest('tr')).toHaveTextContent('Concluído')
  })

  it('filters by school and search', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    await screen.findByRole('table', { name: 'Alunos' })
    fireEvent.change(screen.getByLabelText('Escola'), { target: { value: 'Escola Técnica Agrícola' } })
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(3)
    fireEvent.change(screen.getByLabelText('Buscar aluno'), { target: { value: 'felipe' } })
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(within(screen.getByRole('table', { name: 'Alunos' })).getAllByRole('row')).toHaveLength(8)
  })

  it('sorts by a column when its header is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: createDemoRuns(MISSIONS) })))
    renderPage()
    const table = await screen.findByRole('table', { name: 'Alunos' })
    fireEvent.click(within(table).getByRole('button', { name: 'Nome' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Ana Souza')
    fireEvent.click(within(table).getByRole('button', { name: 'Nome' }))
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Gabriela Nunes')
  })

  it('keeps null scores last whatever the direction', () => {
    const rows = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students
    expect(sortStudents(rows, 'post', 'asc').at(-1)?.post).toBeNull()
    expect(sortStudents(rows, 'post', 'desc').at(-1)?.post).toBeNull()
  })

  it('switches to clearly labelled demo data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { runs: [] })))
    renderPage()
    await screen.findByText('Nenhum aluno enviou dados ainda.')
    fireEvent.click(screen.getByRole('button', { name: 'Demonstração' }))
    expect(screen.getByText('DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Alunos' })).toBeInTheDocument()
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
