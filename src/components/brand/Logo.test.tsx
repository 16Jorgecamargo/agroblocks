import { render, screen } from '@testing-library/react'
import { Logo } from '@/components/brand/Logo'

describe('Logo', () => {
  it('renders the leaf A wordmark with a sprout on the k only in the large version', () => {
    const { container, rerender } = render(<Logo size="lg" />)
    expect(container.querySelector('svg.logo__a')).not.toBeNull()
    expect(container.querySelectorAll('.logo__a-leaf')).toHaveLength(2)
    expect(container.querySelector('.logo__agro')).toHaveTextContent('gro')
    expect(container.querySelector('.logo__blocks')).toHaveTextContent('Blocks')
    expect(container.querySelector('.logo__k .logo__sprout')).not.toBeNull()
    expect(container.querySelector('.logo--brand')).not.toBeNull()
    rerender(<Logo />)
    expect(container.querySelector('svg.logo__a')).not.toBeNull()
    expect(container.querySelector('.logo__sprout')).toBeNull()
    expect(container.querySelector('.logo--mono')).not.toBeNull()
  })

  it('keeps gradient ids unique when two logos share the page', () => {
    const { container } = render(
      <>
        <Logo size="lg" />
        <Logo />
      </>,
    )
    const ids = [...container.querySelectorAll('linearGradient')].map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
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
