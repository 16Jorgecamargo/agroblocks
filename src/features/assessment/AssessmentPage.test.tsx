import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { itemsFor } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { missionsOfWorld } from '@/data/worlds'
import { AssessmentPage } from '@/features/assessment/AssessmentPage'
import { isWorldOpen } from '@/game/progress/progression'
import type { WorldId } from '@/game/worlds/worldTypes'
import { useProgressStore } from '@/stores/progressStore'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/avaliacao/:world/:form" element={<AssessmentPage />} />
        <Route path="/avaliacao/:form" element={<AssessmentPage />} />
        <Route path="/missoes" element={<p>Mapa de missões</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function answerAll(world: WorldId, form: 'pre' | 'post', correct: boolean) {
  const items = itemsFor(world, form)
  for (const [position, item] of items.entries()) {
    await screen.findByText(`Questão ${position + 1} de ${items.length}`)
    const index = correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length
    fireEvent.click(await screen.findByRole('radio', { name: item.options[index] }))
    fireEvent.click(screen.getByRole('button', { name: /Próxima|Concluir/ }))
  }
}

function storeTest(world: WorldId, form: 'pre' | 'post') {
  useProgressStore.getState().storeAssessment({ world, form, startedAt: 's', completedAt: 'c', skipped: false, answers: {} })
}

function completeWorld(world: WorldId) {
  for (const mission of missionsOfWorld(world, MISSIONS)) {
    useProgressStore.getState().recordAttempt({
      missionId: mission.id,
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 1,
      blocks: 1,
      usage: { seeds: 0, water: 0, energy: 1 },
      efficiencyStars: 3,
      pseudocode: '',
    })
  }
}

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

describe('AssessmentPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('runs the Horta pre-test one question at a time without feedback and stores answers', async () => {
    renderAt('/avaliacao/garden/pre')
    expect(screen.getByRole('heading', { level: 1, name: 'Prova inicial · Horta' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pular/ })).not.toBeInTheDocument()
    expect(screen.getByText(/É normal não saber várias respostas/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    await answerAll('garden', 'pre', true)
    expect(await screen.findByRole('heading', { name: 'Obrigado!' })).toBeInTheDocument()
    expect(screen.queryByText(/correta|errada/i)).not.toBeInTheDocument()
    expect(screen.getByText('Suas respostas foram salvas e enviadas ao seu professor.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Começar Horta' })).toHaveAttribute('href', '/jogar/garden-01')
    expect(Object.keys(useProgressStore.getState().save.assessments.garden.pre?.answers ?? {})).toHaveLength(10)
  })

  it('runs the Milharal pre-test and opens its first mission', async () => {
    storeTest('garden', 'post')
    renderAt('/avaliacao/cornfield/pre')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll('cornfield', 'pre', false)
    expect(await screen.findByRole('link', { name: 'Começar Milharal' })).toHaveAttribute('href', '/jogar/cornfield-01')
    expect(Object.keys(useProgressStore.getState().save.assessments.cornfield.pre?.answers ?? {})).toHaveLength(10)
  })

  it('locks the post-test until the ten missions are done', () => {
    storeTest('garden', 'pre')
    renderAt('/avaliacao/garden/pos')
    expect(screen.getByText('Conclua as 10 missões de Horta para fazer a prova final.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
  })

  it('opens the next world after the post-test and compares by skill', async () => {
    storeTest('garden', 'pre')
    completeWorld('garden')
    renderAt('/avaliacao/garden/pos')
    expect(screen.getByRole('heading', { level: 1, name: 'Prova final · Horta' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll('garden', 'post', true)
    expect(await screen.findByRole('link', { name: 'Ir para Milharal' })).toHaveAttribute('href', '/missoes')
    const table = screen.getByRole('table', { name: 'Acertos por habilidade · Horta' })
    const row = within(table).getByRole('row', { name: /Montar/ })
    expect(row).toHaveTextContent('0%')
    expect(row).toHaveTextContent('100%')
    expect(isWorldOpen(useProgressStore.getState().save, 'cornfield', refs)).toBe(true)
  })

  it('shows the done screen when the test was already answered', () => {
    storeTest('garden', 'pre')
    renderAt('/avaliacao/garden/pre')
    expect(screen.getByRole('heading', { name: 'Obrigado!' })).toBeInTheDocument()
  })

  it('sends unknown worlds back to the missions', () => {
    renderAt('/avaliacao/moon/pre')
    expect(screen.getByText('Mapa de missões')).toBeInTheDocument()
  })

  it('sends a closed world back to the missions', () => {
    renderAt('/avaliacao/cornfield/pre')
    expect(screen.getByText('Mapa de missões')).toBeInTheDocument()
  })

  it('sends the old single test route back to the missions', () => {
    renderAt('/avaliacao/pre')
    expect(screen.getByText('Mapa de missões')).toBeInTheDocument()
  })
})
