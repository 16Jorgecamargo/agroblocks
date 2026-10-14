import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function renderDialog() {
  return render(
    <MemoryRouter>
      <SettingsDialog onClose={() => undefined} />
    </MemoryRouter>,
  )
}

describe('SettingsDialog', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS })
    useProgressStore.getState().resetProgress()
  })

  it('toggles dark mode from the general tab', () => {
    renderDialog()
    fireEvent.click(screen.getByRole('switch', { name: 'Modo escuro' }))
    expect(useSettingsStore.getState().settings.theme).toBe('dark')
  })

  it('switches tabs and changes the render mode', () => {
    renderDialog()
    fireEvent.click(screen.getByRole('tab', { name: /Visual/ }))
    fireEvent.change(screen.getByLabelText('Visualização da fazenda'), { target: { value: '2d' } })
    expect(useSettingsStore.getState().settings.renderMode).toBe('2d')
  })

  it('asks for confirmation before resetting progress', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    renderDialog()
    fireEvent.click(screen.getByRole('tab', { name: /Dados/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar progresso' }))
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].hintsUsed).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar tudo' }))
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].hintsUsed).toBe(0)
  })
})
