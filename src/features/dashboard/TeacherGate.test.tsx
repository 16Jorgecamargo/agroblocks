import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TeacherGate } from '@/features/dashboard/TeacherGate'
import { TOKEN_KEY } from '@/services/teacher/teacherApi'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/painel']}>
      <Routes>
        <Route path="/" element={<p>inicio</p>} />
        <Route path="/painel" element={<TeacherGate />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeacherGate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.removeItem(TOKEN_KEY)
  })

  it('asks for the password and refuses a wrong one', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { error: 'wrong-password' })))
    renderGate()
    expect(screen.getByRole('dialog', { name: 'Senha do professor' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Senha incorreta.')).toBeInTheDocument()
  })

  it('opens the dashboard with the right password', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).endsWith('login') ? json(200, { token: 't', expiresAt: Date.now() + 60_000 }) : json(200, { runs: [] }))))
    renderGate()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'dashboard' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { name: 'Painel do professor' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Senha do professor' })).not.toBeInTheDocument()
  })

  it('explains a server without configuration and goes back home', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(503, { error: 'not-configured' })))
    renderGate()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'dashboard' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Painel indisponível: servidor não configurado.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('inicio')).toBeInTheDocument()
  })
})
