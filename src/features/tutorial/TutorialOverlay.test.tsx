import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TutorialOverlay } from '@/features/tutorial/TutorialOverlay'
import type { ExecutionSnapshot } from '@/game/execution/types'

const snap = (status: ExecutionSnapshot['status'], success = false) =>
  ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as ExecutionSnapshot

function renderOverlay(snapshot: ExecutionSnapshot, blockEvent: { kind: 'added' | 'removed'; id: number } | null = null) {
  return render(
    <MemoryRouter>
      <TutorialOverlay snapshot={snapshot} blockEvent={blockEvent} />
    </MemoryRouter>,
  )
}

describe('TutorialOverlay', () => {
  it('walks through steps driven by real events', () => {
    const { rerender } = renderOverlay(snap('idle'))
    expect(screen.getByText('1/6')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByText('2/6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('idle')} blockEvent={{ kind: 'added', id: 1 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('3/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('idle')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('4/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('running')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('5/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('failed')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('6/6')).toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('running')} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    rerender(
      <MemoryRouter>
        <TutorialOverlay snapshot={snap('finished', true)} blockEvent={{ kind: 'removed', id: 2 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Treinamento concluído!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para as missões' })).toHaveAttribute('href', '/missoes')
  })
})
