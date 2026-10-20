import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProgressStore } from '@/stores/progressStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function renderDialog() {
  return render(
    <MemoryRouter>
      <SettingsDialog open onClose={() => undefined} />
    </MemoryRouter>,
  )
}

describe('SettingsDialog', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS })
    useProgressStore.getState().resetProgress()
  })

  it('keeps the same fixed size on every tab', () => {
    renderDialog()
    expect(screen.getByRole('dialog', { name: 'Configurações' })).toHaveClass('game-dialog--fixed')
  })

  it('toggles dark mode from the general tab', () => {
    renderDialog()
    fireEvent.click(screen.getByRole('switch', { name: 'Modo escuro' }))
    expect(useSettingsStore.getState().settings.theme).toBe('dark')
  })

  it('offers no 2D view: the farm is always 3D', async () => {
    renderDialog()
    fireEvent.click(screen.getByRole('tab', { name: /Visual/ }))
    expect(await screen.findByRole('switch', { name: 'Gráficos leves' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Visualização da fazenda')).not.toBeInTheDocument()
  })

  it('asks for confirmation before resetting progress', async () => {
    useProgressStore.getState().registerHint('garden-04')
    renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: 'Reiniciar progresso' }))
    expect(useProgressStore.getState().save.missions['garden-04'].hintsUsed).toBe(1)
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, apagar tudo' }))
    expect(useProgressStore.getState().save.missions['garden-04'].hintsUsed).toBe(0)
  })

  it('starts a new run for the same student when progress is reset', async () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    const runId = useProgressStore.getState().save.runId
    useProgressStore.getState().registerHint('garden-04')
    renderDialog()
    fireEvent.click(await screen.findByRole('button', { name: 'Reiniciar progresso' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sim, apagar tudo' }))
    const save = useProgressStore.getState().save
    expect(save.student?.name).toBe('Ana Souza')
    expect(save.runId).not.toBe(runId)
    expect(save.missions['garden-04'].hintsUsed).toBe(0)
  })
})
