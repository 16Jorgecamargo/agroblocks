import { fireEvent, render, screen } from '@testing-library/react'
import { TutorialCallout } from '@/features/tutorial/TutorialCallout'
import { TutorialSpotlight } from '@/features/tutorial/TutorialSpotlight'
import { targetSelector } from '@/features/tutorial/useTargetRects'

describe('TutorialSpotlight', () => {
  it('cuts one hole and one ring per target rect', () => {
    render(
      <TutorialSpotlight
        rects={[
          { x: 10, y: 10, width: 100, height: 100 },
          { x: 300, y: 10, width: 100, height: 100 },
        ]}
      />,
    )
    const dim = screen.getByTestId('tutorial-spotlight')
    expect(dim.style.clipPath).toContain('evenodd')
    expect(document.querySelectorAll('.tutorial-spotlight__ring')).toHaveLength(2)
  })

  it('builds the target selector from the data attribute', () => {
    expect(targetSelector('editor')).toBe('[data-tutorial="editor"]')
  })
})

describe('TutorialCallout', () => {
  it('shows the step text, a notice and the replay button on practice steps', () => {
    const onShowHowTo = vi.fn()
    render(<TutorialCallout target={{ x: 8, y: 80, width: 500, height: 700 }} title="Adicionar um bloco" text="Arraste o bloco." notice="Tente de novo." practice onShowHowTo={onShowHowTo} />)
    const callout = screen.getByRole('dialog', { name: 'Adicionar um bloco' })
    expect(callout).toHaveTextContent('Arraste o bloco.')
    expect(callout).toHaveTextContent('Tente de novo.')
    expect(callout).toHaveTextContent('Faça a ação para continuar.')
    fireEvent.click(screen.getByRole('button', { name: 'Ver animação' }))
    expect(onShowHowTo).toHaveBeenCalledTimes(1)
  })

  it('has no replay button on tour steps', () => {
    render(<TutorialCallout target={null} title="A fazenda" text="Olhe a fazenda." notice={null} practice={false} onShowHowTo={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Ver animação' })).not.toBeInTheDocument()
  })
})
