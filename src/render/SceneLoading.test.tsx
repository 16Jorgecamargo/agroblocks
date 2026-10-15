import { render, screen } from '@testing-library/react'
import { SceneLoading } from '@/render/SceneLoading'

describe('SceneLoading', () => {
  it('announces loading', () => {
    render(<SceneLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando fazenda')
  })
})
