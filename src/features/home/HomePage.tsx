import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { getMission, MISSIONS } from '@/data/missions'
import { HomeScene } from '@/features/home/HomeScene'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { StudentDialog } from '@/features/student/StudentDialog'
import { continueMissionId, hasProgress } from '@/game/progress/progression'
import { PRESSABLE, softRise, staggerContainer, staggerItem } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import type { StudentInfo } from '@/shared/student'
import { useProgressStore } from '@/stores/progressStore'
import './HomePage.css'

const TRAINING_ID = 'm0-training'

export function HomePage() {
  const navigate = useNavigate()
  const { ambient } = useMotionPrefs()
  const save = useProgressStore((store) => store.save)
  const startRun = useProgressStore((store) => store.startRun)
  const registerStudent = useProgressStore((store) => store.registerStudent)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const [registerFor, setRegisterFor] = useState<'new' | 'continue' | null>(null)
  const continueId = continueMissionId(save, MISSIONS)
  const continueMission = continueId ? getMission(continueId) : undefined
  const phases = MISSIONS.filter((mission) => !mission.tutorial)
  const completed = phases.filter((mission) => save.missions[mission.id]?.status === 'completed').length

  const startNew = () => {
    if (hasProgress(save)) {
      setConfirmNew(true)
      return
    }
    setRegisterFor('new')
  }

  return (
    <div className="home">
      <HomeScene />
      <motion.nav className="home__top-links" aria-label="Mais opções" variants={staggerItem} initial="hidden" animate="visible">
        <Link to="/missoes">Missões</Link>
        <Link to="/avaliacao/pre">Avaliação</Link>
        <Link to="/painel">Painel do professor</Link>
      </motion.nav>
      <motion.header className="home__hero" variants={staggerContainer(0.1, 0.1)} initial="hidden" animate="visible">
        <div className="home__lockup">
          <motion.h1 className="home__brand" variants={softRise}>
            <Logo size="lg" animated={ambient} />
          </motion.h1>
          <motion.p className="home__tagline" variants={staggerItem}>
            Automatize. Programe. Cultive.
          </motion.p>
        </div>
      </motion.header>
      <motion.main className="home__actions" variants={staggerContainer(0.09, 0.45)} initial="hidden" animate="visible">
        <motion.span className="home__progress" variants={staggerItem}>
          {completed} de {phases.length} fases concluídas
        </motion.span>
        <motion.button type="button" className="home__cta home__cta--primary" onClick={startNew} variants={staggerItem} {...PRESSABLE}>
          <Icon name="play" size={26} />
          Iniciar nova fazenda
        </motion.button>
        <motion.button
          type="button"
          className="home__cta home__cta--dark"
          disabled={!continueMission}
          onClick={() => {
            if (!continueMission) return
            if (save.student) navigate(`/jogar/${continueMission.id}`)
            else setRegisterFor('continue')
          }}
          variants={staggerItem}
          {...(continueMission ? PRESSABLE : {})}
        >
          <Icon name="chart" size={26} />
          <span className="home__cta-text">
            Continuar missão
            {continueMission && (
              <small>{continueMission.tutorial ? continueMission.title : `Fase ${continueMission.order} - ${continueMission.title}`}</small>
            )}
          </span>
        </motion.button>
        <motion.div className="home__small" variants={staggerItem}>
          <motion.span {...PRESSABLE}>
            <Link to="/como-jogar" className="home__chip">
              <Icon name="help" /> Como jogar
            </Link>
          </motion.span>
          <motion.button type="button" className="home__chip" onClick={() => setShowSettings(true)} {...PRESSABLE}>
            <Icon name="gear" /> Configurações
          </motion.button>
        </motion.div>
      </motion.main>
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
              setConfirmNew(false)
              setRegisterFor('new')
            }}
          >
            Apagar e começar
          </GameButton>
        </DialogSection>
      </GameDialog>
      <StudentDialog
        open={registerFor !== null}
        onCancel={() => setRegisterFor(null)}
        onConfirm={(student: StudentInfo) => {
          const target = registerFor
          setRegisterFor(null)
          if (target === 'new') {
            startRun(student)
            navigate(`/jogar/${TRAINING_ID}`)
            return
          }
          registerStudent(student)
          if (continueMission) navigate(`/jogar/${continueMission.id}`)
        }}
      />
    </div>
  )
}
