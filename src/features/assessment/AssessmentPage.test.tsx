import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AssessmentPage } from '@/features/assessment/AssessmentPage'
import { itemsForForm } from '@/data/assessment/items'
import { useProgressStore } from '@/stores/progressStore'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/avaliacao/:form" element={<AssessmentPage />} />
        <Route path="/" element={<p>início</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function answerAll(form: 'pre' | 'post', correct: boolean) {
  const items = itemsForForm(form)
  for (const [position, item] of items.entries()) {
    await screen.findByText(`Questão ${position + 1} de ${items.length}`)
    const index = correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length
    fireEvent.click(await screen.findByRole('radio', { name: item.options[index] }))
    fireEvent.click(screen.getByRole('button', { name: /Próxima|Concluir/ }))
  }
}

describe('AssessmentPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('runs the pre-test one question at a time without feedback and stores answers', async () => {
    renderAt('/avaliacao/pre')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    expect(screen.getByText('Questão 1 de 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    await answerAll('pre', true)
    expect(await screen.findByRole('heading', { name: 'Obrigado!' })).toBeInTheDocument()
    expect(screen.queryByText(/correta|errada/i)).not.toBeInTheDocument()
    const stored = useProgressStore.getState().save.assessments.pre
    expect(stored?.skipped).toBe(false)
    expect(Object.keys(stored?.answers ?? {})).toHaveLength(10)
  })

  it('requires the pre-test and then sends the student to the training', async () => {
    renderAt('/avaliacao/pre')
    expect(screen.queryByRole('button', { name: 'Pular por enquanto' })).not.toBeInTheDocument()
    expect(screen.getByText(/É normal não saber várias respostas/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll('pre', false)
    expect(await screen.findByRole('link', { name: 'Começar o treinamento' })).toHaveAttribute('href', '/jogar/m0-training')
    expect(screen.getByText('Suas respostas foram salvas e enviadas ao seu professor.')).toBeInTheDocument()
  })

  it('locks the post-test until phase 6 is completed', () => {
    renderAt('/avaliacao/pos')
    expect(screen.getByText(/Conclua a Fase 6/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
  })

  it('compares pre and post by concept after the post-test', async () => {
    useProgressStore.getState().storeAssessment({ form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers: {} })
    useProgressStore.getState().recordAttempt({
      missionId: 'homestead-10',
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 72,
      blocks: 19,
      usage: { seeds: 16, water: 16, energy: 64 },
      efficiencyStars: 3,
      pseudocode: '',
    })
    renderAt('/avaliacao/pos')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    await answerAll('post', true)
    const row = await screen.findByRole('row', { name: /Sequenciamento/ })
    expect(row).toHaveTextContent('0%')
    expect(row).toHaveTextContent('100%')
  })

  it('redirects unknown forms home', () => {
    renderAt('/avaliacao/xyz')
    expect(screen.getByText('início')).toBeInTheDocument()
  })
})
