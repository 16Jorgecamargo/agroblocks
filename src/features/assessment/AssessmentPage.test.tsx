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

function answerAll(form: 'pre' | 'post', correct: boolean) {
  for (const item of itemsForForm(form)) {
    const index = correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length
    fireEvent.click(screen.getByRole('radio', { name: item.options[index] }))
    fireEvent.click(screen.getByRole('button', { name: /Próxima|Concluir/ }))
  }
}

describe('AssessmentPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('runs the pre-test one question at a time without feedback and stores answers', () => {
    renderAt('/avaliacao/pre')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    expect(screen.getByText('Questão 1 de 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    answerAll('pre', true)
    expect(screen.queryByText(/correta|errada/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Obrigado!' })).toBeInTheDocument()
    const stored = useProgressStore.getState().save.assessments.pre
    expect(stored?.skipped).toBe(false)
    expect(Object.keys(stored?.answers ?? {})).toHaveLength(10)
  })

  it('allows skipping the pre-test and records it', () => {
    renderAt('/avaliacao/pre')
    fireEvent.click(screen.getByRole('button', { name: 'Pular por enquanto' }))
    expect(useProgressStore.getState().save.assessments.pre?.skipped).toBe(true)
  })

  it('locks the post-test until phase 6 is completed', () => {
    renderAt('/avaliacao/pos')
    expect(screen.getByText(/Conclua a Fase 6/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
  })

  it('compares pre and post by concept after the post-test', () => {
    useProgressStore.getState().storeAssessment({ form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers: {} })
    useProgressStore.getState().recordAttempt({
      missionId: 'm6-efficient-farm',
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
    answerAll('post', true)
    const row = screen.getByRole('row', { name: /Sequenciamento/ })
    expect(row).toHaveTextContent('0%')
    expect(row).toHaveTextContent('100%')
  })

  it('redirects unknown forms home', () => {
    renderAt('/avaliacao/xyz')
    expect(screen.getByText('início')).toBeInTheDocument()
  })
})
