import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { getMission, MISSIONS } from '@/data/missions'
import { HomeScene } from '@/features/home/HomeScene'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { continueMissionId, hasProgress } from '@/game/progress/progression'
import { useProgressStore } from '@/stores/progressStore'
import './HomePage.css'

const TRAINING_ID = 'm0-training'

export function HomePage() {
  const navigate = useNavigate()
  const save = useProgressStore((store) => store.save)
  const resetProgress = useProgressStore((store) => store.resetProgress)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const continueId = continueMissionId(save, MISSIONS)
  const continueMission = continueId ? getMission(continueId) : undefined
  const phases = MISSIONS.filter((mission) => !mission.tutorial)
  const completed = phases.filter((mission) => save.missions[mission.id]?.status === 'completed').length

  const startNew = () => {
    if (hasProgress(save)) {
      setConfirmNew(true)
      return
    }
    navigate(`/jogar/${TRAINING_ID}`)
  }

  return (
    <div className="home">
      <HomeScene />
      <main className="home__panel">
        <h1 className="home__brand">
          <Logo size="lg" />
        </h1>
        <p className="home__tagline">Automatize. Programe. Cultive.</p>
        <p className="home__intro">Construa algoritmos, controle robôs e transforme sua fazenda em um sistema inteligente.</p>
        <div className="home__actions">
          <button type="button" className="home__cta home__cta--primary" onClick={startNew}>
            <Icon name="play" size={22} />
            Iniciar nova fazenda
          </button>
          <button
            type="button"
            className="home__cta home__cta--dark"
            disabled={!continueMission}
            onClick={() => continueMission && navigate(`/jogar/${continueMission.id}`)}
          >
            <Icon name="chart" size={22} />
            <span className="home__cta-text">
              Continuar missão
              {continueMission && (
                <small>{continueMission.tutorial ? continueMission.title : `Fase ${continueMission.order} - ${continueMission.title}`}</small>
              )}
            </span>
          </button>
        </div>
        <div className="home__progress" aria-hidden={false}>
          <span>
            {completed} de {phases.length} fases concluídas
          </span>
          <progress max={phases.length} value={completed} aria-label="Progresso nas fases" />
        </div>
        <nav className="home__links" aria-label="Mais opções">
          <Link to="/como-jogar" className="home__link">
            <Icon name="help" /> Como jogar
          </Link>
          <button type="button" className="home__link" onClick={() => setShowSettings(true)}>
            <Icon name="gear" /> Configurações
          </button>
          <Link to="/missoes" className="home__link">
            <Icon name="flag" /> Missões
          </Link>
          <Link to="/avaliacao/pre" className="home__link">
            <Icon name="book" /> Avaliação
          </Link>
          <Link to="/painel" className="home__link">
            <Icon name="chart" /> Painel do professor
          </Link>
        </nav>
      </main>
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      <GameDialog open={confirmNew} title="Começar uma nova fazenda?" icon="trash" tone="danger" onClose={() => setConfirmNew(false)}>
        <DialogSection>
          <p>Isso apaga o progresso, as tentativas e as respostas de avaliação salvas neste navegador.</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          <GameButton tone="secondary" onClick={() => setConfirmNew(false)}>
            Cancelar
          </GameButton>
          <GameButton
            tone="danger"
            onClick={() => {
              resetProgress()
              navigate(`/jogar/${TRAINING_ID}`)
            }}
          >
            Apagar e começar
          </GameButton>
        </DialogSection>
      </GameDialog>
    </div>
  )
}
