import { render, screen } from '@testing-library/react'
import { Logo, LOGO_SOURCES } from '@/components/brand/Logo'

describe('Logo', () => {
  it('shows the illustrated logo image at the requested size', () => {
    const { rerender } = render(<Logo size="lg" />)
    expect(screen.getByRole('img', { name: 'AgroBlocks' })).toHaveAttribute('src', LOGO_SOURCES.lg)
    rerender(<Logo />)
    expect(screen.getByRole('img', { name: 'AgroBlocks' })).toHaveAttribute('src', LOGO_SOURCES.sm)
  })

  it('gives a heading the accessible name AgroBlocks', () => {
    render(
      <h1>
        <Logo size="lg" />
      </h1>,
    )
    expect(screen.getByRole('heading', { name: 'AgroBlocks' })).toBeInTheDocument()
  })
})
