import { act, render, screen, waitFor } from '@testing-library/react'
import { SceneWithSplash } from '@/render/SceneWithSplash'

const loader = { active: false, progress: 0 }

vi.mock('@react-three/drei', () => ({
  useProgress: () => loader,
}))

function Ready({ onReady }: { onReady: () => void }) {
  return (
    <button type="button" onClick={onReady}>
      canvas
    </button>
  )
}

describe('SceneWithSplash', () => {
  beforeEach(() => {
    loader.active = false
    loader.progress = 0
  })

  it('covers the scene with a loading status and real progress', () => {
    loader.active = true
    loader.progress = 40
    render(<SceneWithSplash>{(onReady) => <Ready onReady={onReady} />}</SceneWithSplash>)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando fazenda')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
  })

  it('stays while assets are still loading even after the canvas exists', async () => {
    loader.active = true
    render(<SceneWithSplash>{(onReady) => <Ready onReady={onReady} />}</SceneWithSplash>)
    act(() => screen.getByRole('button', { name: 'canvas' }).click())
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('leaves once the canvas exists and the loader is idle, even with no assets or a failed load', async () => {
    render(<SceneWithSplash>{(onReady) => <Ready onReady={onReady} />}</SceneWithSplash>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'canvas' }).click())
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 3000 })
  })
})
