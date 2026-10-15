import { fireEvent, render, screen } from '@testing-library/react'
import { getMission } from '@/data/missions'
import { BriefingDialog } from '@/features/gameplay/components/BriefingDialog'

function open(id: string) {
  const mission = getMission(id)
  if (!mission) throw new Error('missing')
  render(<BriefingDialog open mission={mission} onStart={vi.fn()} onDemo={vi.fn()} />)
  return mission
}

describe('BriefingDialog', () => {
  it('leads with the goal and the concept as a short tag', () => {
    const mission = open('m3-smart-irrigation')
    expect(screen.getByRole('heading', { name: 'Objetivo' })).toBeInTheDocument()
    expect(screen.getByText(mission.briefing.goalText)).toBeInTheDocument()
    expect(screen.getByText('Condicionais (se / senão)', { exact: false })).toBeInTheDocument()
  })

  it('keeps the concept explanation folded until asked', () => {
    const mission = open('m3-smart-irrigation')
    const toggle = screen.getByRole('button', { name: 'Sobre o conceito' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(mission.briefing.conceptIntro)).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(mission.briefing.conceptIntro)).toBeInTheDocument()
  })

  it('shows only the resources the mission uses, as chips', () => {
    open('m3-smart-irrigation')
    const resources = screen.getByRole('list', { name: 'Recursos iniciais' })
    expect(resources).toHaveTextContent('Água')
    expect(resources).toHaveTextContent('4')
    expect(resources).not.toHaveTextContent('Sementes')
    expect(resources).not.toHaveTextContent('Energia')
  })

  it('lists limits as short chips and drops the long reminder', () => {
    open('m3-smart-irrigation')
    expect(screen.getByText('Usar no máximo 3', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText(/O objetivo é entender o algoritmo/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Recursos iniciais: sementes/)).not.toBeInTheDocument()
  })
})
