import { fireEvent, render, screen, within } from '@testing-library/react'
import { MISSIONS } from '@/data/missions'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { StudentDetail } from '@/features/dashboard/StudentDetail'

const students = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students
const bruno = students.find((row) => row.name === 'Bruno Lima')

describe('StudentDetail', () => {
  it('shows every run with tutorial, phases, attempts and answers', () => {
    if (!bruno) throw new Error('demo student missing')
    render(<StudentDetail student={bruno} demo={false} onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    const dialog = screen.getByRole('dialog', { name: 'Bruno Lima' })
    expect(within(dialog).getAllByRole('heading', { name: /^Jogada de / })).toHaveLength(2)
    expect(dialog).toHaveTextContent('Tutorial: Concluído')
    expect(dialog).toHaveTextContent(/Tutorial: Pulado na etapa \d+ de 15/)
    expect(within(dialog).getAllByText('Pseudocódigo').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByRole('heading', { name: 'Horta · 10 de 10' }).length).toBeGreaterThan(0)
    expect(dialog).toHaveTextContent(/Prova inicial: \d+ de 10/)
    expect(within(dialog).getAllByText('✓').length).toBeGreaterThan(0)
  })

  it('shows the details of one phase when its plot is chosen', () => {
    if (!bruno) throw new Error('demo student missing')
    render(<StudentDetail student={bruno} demo={false} onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    const dialog = screen.getByRole('dialog', { name: 'Bruno Lima' })
    fireEvent.click(within(dialog).getAllByRole('button', { name: /^Primeira colheita:/ }).at(-1) as HTMLElement)
    const facts = within(dialog).getByRole('region', { name: 'Detalhes de Primeira colheita' })
    expect(facts).toHaveTextContent('Concluída')
    expect(facts).toHaveTextContent(/\d+ comandos, \d+ blocos/)
    expect(within(dialog).getByRole('heading', { name: 'Tentativas em Primeira colheita' })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ver todas as fases' }))
    expect(within(dialog).queryByRole('region', { name: 'Detalhes de Primeira colheita' })).not.toBeInTheDocument()
  })

  it('closes with Escape and with the close button', () => {
    if (!bruno) throw new Error('demo student missing')
    const onClose = vi.fn()
    render(<StudentDetail student={bruno} demo={false} onClose={onClose} onDeleteRun={vi.fn(async () => undefined)} />)
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('confirms before deleting a run', async () => {
    if (!bruno) throw new Error('demo student missing')
    const onDeleteRun = vi.fn(async () => undefined)
    render(<StudentDetail student={bruno} demo={false} onClose={vi.fn()} onDeleteRun={onDeleteRun} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Apagar jogada' })[0])
    expect(screen.getByText('Apagar esta jogada? Esta ação não pode ser desfeita.')).toBeInTheDocument()
    expect(onDeleteRun).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
    await vi.waitFor(() => expect(onDeleteRun).toHaveBeenCalledWith(bruno.runs[0].runId))
  })

  it('hides deletion for demo data and renders nothing without a student', async () => {
    if (!bruno) throw new Error('demo student missing')
    const { rerender } = render(<StudentDetail student={bruno} demo onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    expect(screen.queryByRole('button', { name: 'Apagar jogada' })).not.toBeInTheDocument()
    rerender(<StudentDetail student={null} demo onClose={vi.fn()} onDeleteRun={vi.fn(async () => undefined)} />)
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
