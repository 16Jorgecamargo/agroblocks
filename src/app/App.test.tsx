import { render, screen } from '@testing-library/react'
import { App } from '@/app/App'

describe('App', () => {
  it('renders the home page brand and tagline', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeInTheDocument()
    expect(screen.getByText('Automatize. Programe. Cultive.')).toBeInTheDocument()
  })
})
