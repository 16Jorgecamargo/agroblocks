import { lazy, Suspense, useMemo, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { MissionDetailCard } from '@/features/mission-select/MissionDetailCard'
import { continueMissionId } from '@/game/progress/progression'
import type { MissionStatus } from '@/game/progress/types'
import { hasWebGL } from '@/render/hasWebGL'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './MissionSelectPage.css'

const MissionMapScene = lazy(() => import('@/features/mission-select/MissionMapScene'))

const STATUS_TEXT: Record<MissionStatus, string> = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' }

export function MissionSelectPage() {
  const save = useProgressStore((store) => store.save)
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const webgl = useMemo(() => hasWebGL(), [])
  const [selectedId, setSelectedId] = useState(() => continueMissionId(save, MISSIONS) ?? 'm0-training')
  const statuses = Object.fromEntries(MISSIONS.map((mission) => [mission.id, save.missions[mission.id]?.status ?? 'locked'])) as Record<string, MissionStatus>
  const selected = MISSIONS.find((mission) => mission.id === selectedId) ?? MISSIONS[0]
  const show3d = renderMode !== '2d' && webgl

  return (
    <div className="chrome-page mission-select">
      <PageHeader title="Seus desafios" subtitle="Complete as missões e aprenda novos conceitos de programação." backTo="/" />
      <div className={`mission-select__body${show3d ? '' : ' mission-select__body--flat'}`}>
        {show3d && (
          <div className="mission-select__map">
            <Suspense fallback={<div className="mission-select__loading">Carregando mapa…</div>}>
              <MissionMapScene missions={MISSIONS} statuses={statuses} selectedId={selected.id} onSelect={setSelectedId} lowGraphics={lowGraphics} />
            </Suspense>
          </div>
        )}
        <ol className="mission-list" aria-label="Lista de fases">
          {MISSIONS.map((mission) => {
            const status = statuses[mission.id]
            const name = mission.tutorial ? `Treinamento · ${STATUS_TEXT[status]}` : `Fase ${mission.order} · ${mission.title} · ${STATUS_TEXT[status]}`
            return (
              <li key={mission.id}>
                <button
                  type="button"
                  className={`mission-list__item mission-list__item--${status}`}
                  aria-pressed={mission.id === selected.id}
                  aria-label={name}
                  onClick={() => setSelectedId(mission.id)}
                >
                  <span className="mission-list__badge" aria-hidden="true">
                    {status === 'locked' ? <Icon name="lock" size={16} /> : status === 'completed' ? <Icon name="check" size={16} /> : mission.order}
                  </span>
                  <span className="mission-list__name">{mission.tutorial ? 'Treinamento' : mission.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <MissionDetailCard mission={selected} progress={save.missions[selected.id]} />
      </div>
    </div>
  )
}
