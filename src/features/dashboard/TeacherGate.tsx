import { useState } from 'react'
import { useNavigate } from 'react-router'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { clearToken, login, readToken, saveToken } from '@/services/teacher/teacherApi'

const MESSAGES = {
  'wrong-password': 'Senha incorreta.',
  'not-configured': 'Painel indisponível: servidor não configurado.',
  offline: 'Sem conexão com o servidor.',
} as const

function PasswordDialog({ onToken }: { onToken: (token: string) => void }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!password || busy) return
    setBusy(true)
    const result = await login(password)
    setBusy(false)
    if (!result.ok) {
      setMessage(MESSAGES[result.reason])
      return
    }
    saveToken(result.token, result.expiresAt)
    onToken(result.token)
  }

  return (
    <div className="chrome-page">
      <GameDialog open title="Senha do professor" icon="lock" tone="info" onClose={() => navigate('/')}>
        <DialogSection>
          <form
            className="teacher-gate"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <label className="field">
              <span className="field__label">Senha</span>
              <input type="password" value={password} autoFocus autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
            </label>
            {message && (
              <p className="teacher-gate__error" role="alert">
                {message}
              </p>
            )}
            <div className="game-dialog__actions">
              <GameButton tone="secondary" icon="back" onClick={() => navigate('/')}>
                Voltar
              </GameButton>
              <GameButton tone="primary" type="submit" icon="lock" disabled={!password || busy}>
                Entrar
              </GameButton>
            </div>
          </form>
        </DialogSection>
      </GameDialog>
    </div>
  )
}

export function TeacherGate() {
  const [token, setToken] = useState<string | null>(() => readToken())
  const signOut = () => {
    clearToken()
    setToken(null)
  }
  if (!token) return <PasswordDialog onToken={setToken} />
  return <DashboardPage token={token} onUnauthorized={signOut} onLogout={signOut} />
}
