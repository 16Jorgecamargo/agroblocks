import { render, screen } from '@testing-library/react'
import { Confetti } from '@/components/game/Confetti'
import { CountUp } from '@/components/game/CountUp'
import { StarRow } from '@/components/game/StarRow'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

describe('celebration components', () => {
  it('labels the star row and renders three stars', () => {
    const { container } = render(<StarRow value={2} label="Eficiência 2 de 3" />)
    expect(screen.getByRole('img', { name: 'Eficiência 2 de 3' })).toBeInTheDocument()
    expect(container.querySelectorAll('.star-row__star')).toHaveLength(3)
    expect(container.querySelectorAll('.star-row__star.is-on')).toHaveLength(2)
  })

  it('shows the final number immediately when motion is reduced', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    const { container } = render(<CountUp value={12} />)
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('12')
    expect(container).toHaveTextContent('12')
  })

  it('counts up to the final number', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    const { container } = render(<CountUp value={7} />)
    expect(container.querySelector('.visually-hidden')).toHaveTextContent('7')
    await screen.findByText('7', { selector: '[aria-hidden="true"]' }, { timeout: 3500 })
  })

  it('renders confetti only when decorative motion is allowed', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    const { container, unmount } = render(<Confetti pieces={20} />)
    expect(container.querySelectorAll('.confetti__piece')).toHaveLength(20)
    unmount()
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    const reduced = render(<Confetti pieces={20} />)
    expect(reduced.container.querySelectorAll('.confetti__piece')).toHaveLength(0)
  })
})
