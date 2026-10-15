import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { GameToggle } from '@/components/game/GameToggle'
import { PillTabs } from '@/components/game/PillTabs'

describe('game controls', () => {
  it('renders a pressable game button with an icon and tone', () => {
    const onClick = vi.fn()
    render(
      <GameButton tone="primary" icon="play" onClick={onClick}>
        Executar
      </GameButton>,
    )
    const button = screen.getByRole('button', { name: 'Executar' })
    expect(button).toHaveClass('game-button--primary')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it('renders a game link', () => {
    render(
      <MemoryRouter>
        <GameLink to="/missoes" tone="secondary">
          Missões
        </GameLink>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Missões' })).toHaveAttribute('href', '/missoes')
  })

  it('toggles a switch', () => {
    const onChange = vi.fn()
    render(<GameToggle label="Passo a passo" checked={false} onChange={onChange} />)
    const toggle = screen.getByRole('switch', { name: 'Passo a passo' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders tabs with a single moving indicator and arrow key navigation', () => {
    const onChange = vi.fn()
    const { container } = render(
      <PillTabs
        items={[
          { id: 'a', label: 'Console' },
          { id: 'b', label: 'Dicas' },
        ]}
        active="a"
        onChange={onChange}
        label="Abas"
        idPrefix="t"
      />,
    )
    expect(screen.getByRole('tab', { name: 'Console' })).toHaveAttribute('aria-selected', 'true')
    expect(container.querySelectorAll('.pill-tabs__indicator')).toHaveLength(1)
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
