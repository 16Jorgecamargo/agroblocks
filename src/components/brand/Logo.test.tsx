import { render, screen } from '@testing-library/react'
import { Logo } from '@/components/brand/Logo'

describe('Logo', () => {
  it('renders the brand wordmark with a sprout only in the large version', () => {
    const { container, rerender } = render(<Logo size="lg" />)
    expect(screen.getByText('Agro')).toHaveClass('logo__agro')
    expect(container.querySelector('.logo__blocks')).toHaveTextContent('Blocks')
    expect(container.querySelector('.logo--brand')).not.toBeNull()
    expect(container.querySelector('.logo__sprout')).not.toBeNull()
    rerender(<Logo />)
    expect(container.querySelector('.logo__sprout')).toBeNull()
    expect(container.querySelector('.logo--mono')).not.toBeNull()
  })

  it('exposes a single unbroken accessible name even when the word parts are laid out as blocks', () => {
    const { container } = render(
      <h1>
        <Logo size="lg" />
      </h1>,
    )
    expect(screen.getByRole('heading', { name: 'AgroBlocks' })).toBeInTheDocument()
    expect(container.querySelector('.logo__word')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.visually-hidden')).toHaveTextContent('AgroBlocks')
  })
})
