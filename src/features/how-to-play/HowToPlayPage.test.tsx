import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { HowToPlayPage } from '@/features/how-to-play/HowToPlayPage'

describe('HowToPlayPage', () => {
  it('explains the loop and links to the interactive training', () => {
    render(
      <MemoryRouter>
        <HowToPlayPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Como jogar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o treinamento interativo' })).toHaveAttribute('href', '/jogar/m0-training')
    expect(screen.getByText(/aprender a construir e compreender algoritmos/)).toBeInTheDocument()
  })
})
