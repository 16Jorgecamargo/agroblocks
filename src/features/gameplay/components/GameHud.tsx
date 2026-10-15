import { useEffect, useMemo, useRef } from 'react'
import { motion, useAnimate } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { RollingNumber } from '@/components/game/RollingNumber'
import { Icon, type IconName } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import { resourceLevel, resourceMaxima } from '@/features/gameplay/hudLogic'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { Resources } from '@/game/world/types'
import { EASINGS } from '@/motion/easings'
import { BADGE_POP, DURATIONS, ERROR_SHAKE } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { useFlightStore } from '@/stores/flightStore'
import './panels.css'

interface ResourceChipProps {
  icon: IconName
  label: string
  value: number | null
  max: number | null
  tone: string
  flightTarget?: boolean
  popKey?: number
}

const GAIN = 'rgba(124, 207, 106, 0.55)'
const LOSS = 'rgba(229, 72, 77, 0.55)'
const REST = 'rgba(28, 42, 53, 1)'

function ResourceChip({ icon, label, value, max, tone, flightTarget = false, popKey = 0 }: ResourceChipProps) {
  const { ambient } = useMotionPrefs()
  const [scope, animateChip] = useAnimate<HTMLDivElement>()
  const previous = useRef(value)
  const text = formatResource(value)
  const spoken = value === null ? `${label}: ilimitada` : `${label}: ${text}`
  const level = resourceLevel(value, max)

  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (!scope.current || before === null || value === null || before === value) return
    animateChip(scope.current, { backgroundColor: [value > before ? GAIN : LOSS, REST] }, { duration: DURATIONS.odometer, ease: EASINGS.easeOutCubic })
    if (resourceLevel(value, max) === 'empty') animateChip(scope.current, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)
  }, [value, max, animateChip, scope])

  useEffect(() => {
    if (popKey > 0 && scope.current) animateChip(scope.current, BADGE_POP.keyframes, BADGE_POP.options)
  }, [popKey, animateChip, scope])

  return (
    <motion.div
      ref={scope}
      className={`resource-chip resource-chip--${tone}`}
      aria-label={spoken}
      role="group"
      data-level={level}
      data-flight-target={flightTarget ? 'harvest' : undefined}
      animate={
        level === 'low' && ambient
          ? { boxShadow: ['0 0 0 0 rgba(242,193,78,0.7)', '0 0 0 6px rgba(242,193,78,0)'] }
          : { boxShadow: '0 0 0 0 rgba(242,193,78,0)' }
      }
      transition={level === 'low' && ambient ? { duration: 1.2, repeat: Infinity, ease: EASINGS.easeInOutSine } : { duration: 0.2 }}
    >
      <Icon name={icon} size={22} />
      <span className="resource-chip__text" aria-hidden="true">
        <span className="resource-chip__label">{label}</span>
        <span className="resource-chip__value">
          <RollingNumber value={text} />
        </span>
      </span>
    </motion.div>
  )
}

interface GameHudProps {
  mission: MissionDefinition
  resources: Resources
  onHelp: () => void
  onSettings: () => void
  onExit: () => void
}

export function GameHud({ mission, resources, onHelp, onSettings, onExit }: GameHudProps) {
  const maxima = useMemo(() => resourceMaxima(mission), [mission])
  const arrivals = useFlightStore((store) => store.arrivals)
  return (
    <motion.header className="game-hud" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={SPRINGS.modal}>
      <Logo />
      <div className="game-hud__mission">
        <h1 className="game-hud__title">{mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`}</h1>
        <p className="game-hud__goal">{mission.briefing.goalText}</p>
      </div>
      <div className="game-hud__resources" aria-label="Recursos">
        <ResourceChip icon="seed" label="Sementes" value={resources.seeds} max={maxima.seeds} tone="seed" />
        <ResourceChip icon="drop" label="Água" value={resources.water} max={maxima.water} tone="water" />
        <ResourceChip icon="bolt" label="Energia" value={resources.energy} max={maxima.energy} tone="energy" />
        <ResourceChip icon="basket" label="Colheita" value={resources.harvested} max={null} tone="harvest" flightTarget popKey={arrivals} />
      </div>
      <div className="game-hud__actions">
        <GameButton tone="dark" icon="help" className="hud-button hud-button--square" onClick={onHelp} aria-label="Ver objetivo e conceito da fase" />
        <GameButton tone="dark" icon="gear" className="hud-button hud-button--square" onClick={onSettings} aria-label="Configurações" />
        <GameButton tone="danger" className="hud-button hud-button--exit" onClick={onExit}>
          Sair
        </GameButton>
      </div>
    </motion.header>
  )
}
