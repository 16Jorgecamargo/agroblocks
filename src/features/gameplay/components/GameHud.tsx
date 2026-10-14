import { Icon, type IconName } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { Resources } from '@/game/world/types'
import './panels.css'

interface GameHudProps {
  mission: MissionDefinition
  resources: Resources
  onHelp: () => void
  onSettings: () => void
  onExit: () => void
}

function ResourceChip({ icon, label, value, tone }: { icon: IconName; label: string; value: number | null; tone: string }) {
  const text = formatResource(value)
  const spoken = value === null ? `${label}: ilimitada` : `${label}: ${text}`
  return (
    <div className={`resource-chip resource-chip--${tone}`} aria-label={spoken} role="group">
      <Icon name={icon} size={22} />
      <span className="resource-chip__text" aria-hidden="true">
        <span className="resource-chip__label">{label}</span>
        <span key={text} className="resource-chip__value">
          {text}
        </span>
      </span>
    </div>
  )
}

export function GameHud({ mission, resources, onHelp, onSettings, onExit }: GameHudProps) {
  return (
    <header className="game-hud">
      <Logo />
      <div className="game-hud__mission">
        <h1 className="game-hud__title">{mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`}</h1>
        <p className="game-hud__goal">{mission.briefing.goalText}</p>
      </div>
      <div className="game-hud__resources" aria-label="Recursos">
        <ResourceChip icon="seed" label="Sementes" value={resources.seeds} tone="seed" />
        <ResourceChip icon="drop" label="Água" value={resources.water} tone="water" />
        <ResourceChip icon="bolt" label="Energia" value={resources.energy} tone="energy" />
        <ResourceChip icon="basket" label="Colheita" value={resources.harvested} tone="harvest" />
      </div>
      <div className="game-hud__actions">
        <button type="button" className="hud-button" onClick={onHelp} aria-label="Ver objetivo e conceito da fase">
          <Icon name="help" />
        </button>
        <button type="button" className="hud-button" onClick={onSettings} aria-label="Configurações">
          <Icon name="gear" />
        </button>
        <button type="button" className="hud-button hud-button--exit" onClick={onExit}>
          Sair
        </button>
      </div>
    </header>
  )
}
