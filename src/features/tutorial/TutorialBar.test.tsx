import { render, screen } from '@testing-library/react'
import { TutorialBar } from '@/features/tutorial/TutorialBar'

const noop = () => undefined

describe('TutorialBar', () => {
  it('sits centred on the given column so it never covers the editor trash', () => {
    render(<TutorialBar index={3} total={15} practice centerX={820} onPrevious={noop} onNext={noop} onShowHowTo={noop} onSkip={noop} />)
    const bar = screen.getByRole('toolbar', { name: 'Tutorial' })
    expect(bar.style.left).toBe('820px')
    expect(screen.getByTestId('tutorial-progress')).toHaveTextContent('4/15')
    expect(bar.querySelector('.tutorial-bar__meter-fill')).toHaveStyle({ width: `${(4 / 15) * 100}%` })
    expect(bar.querySelectorAll('.tutorial-bar__dots')).toHaveLength(0)
  })

  it('falls back to the middle of the screen without a column', () => {
    render(<TutorialBar index={0} total={15} practice={false} centerX={null} onPrevious={noop} onNext={noop} onShowHowTo={noop} onSkip={noop} />)
    expect(screen.getByRole('toolbar', { name: 'Tutorial' }).style.left).toBe('50%')
  })
})
