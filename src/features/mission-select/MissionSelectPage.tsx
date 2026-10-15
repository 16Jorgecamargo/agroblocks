import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { MissionDetailCard } from '@/features/mission-select/MissionDetailCard'
import { newlyUnlocked } from '@/features/mission-select/unlocks'
import { continueMissionId } from '@/game/progress/progression'
import type { MissionStatus } from '@/game/progress/types'
import { EASINGS } from '@/motion/easings'
import { gridWaveItem, PRESSABLE } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { hasWebGL } from '@/render/hasWebGL'
import { safeStorage } from '@/services/storage/jsonStorage'
import { loadSeenUnlocks, saveSeenUnlocks } from '@/services/storage/seenUnlocks'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './MissionSelectPage.css'

const MissionMapScene = lazy(() => import('@/features/mission-select/MissionMapScene'))

const STATUS_TEXT: Record<MissionStatus, string> = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' }

function ListBadge({ status, order, celebrate }: { status: MissionStatus; order: number; celebrate: boolean }) {
  const [opened, setOpened] = useState(!celebrate)
  useEffect(() => {
    if (!celebrate) return
    const timer = window.setTimeout(() => setOpened(true), 900)
    return () => window.clearTimeout(timer)
  }, [celebrate])
  const content = status === 'locked' || !opened ? 'lock' : status === 'completed' ? 'check' : 'number'
  return (
    <span className="mission-list__badge" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={content}
          initial={{ scale: 0, rotate: -90 }}
          animate={celebrate && content === 'lock' ? { scale: [1, 1.2, 1], rotate: [0, -15, 15, 0] } : { scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90, transition: { duration: 0.2 } }}
          transition={SPRINGS.jelly}
        >
          {content === 'lock' ? <Icon name="lock" size={16} /> : content === 'check' ? <Icon name="check" size={16} /> : order}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function MissionSelectPage() {
  const save = useProgressStore((store) => store.save)
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const { ambient } = useMotionPrefs()
  const webgl = useMemo(() => hasWebGL(), [])
  const [selectedId, setSelectedId] = useState(() => continueMissionId(save, MISSIONS) ?? 'm0-training')
  const [celebrateIds] = useState(() => newlyUnlocked(save, MISSIONS.map((mission) => mission.id), loadSeenUnlocks(safeStorage())))
  const statuses = Object.fromEntries(MISSIONS.map((mission) => [mission.id, save.missions[mission.id]?.status ?? 'locked'])) as Record<string, MissionStatus>
  const selected = MISSIONS.find((mission) => mission.id === selectedId) ?? MISSIONS[0]
  const show3d = renderMode !== '2d' && webgl

  useEffect(() => {
    if (celebrateIds.length === 0) return
    saveSeenUnlocks(safeStorage(), [...loadSeenUnlocks(safeStorage()), ...celebrateIds])
  }, [celebrateIds])

  return (
    <div className="chrome-page mission-select">
      <PageHeader title="Seus desafios" subtitle="Complete as missões e aprenda novos conceitos de programação." backTo="/" />
      <div className={`mission-select__body${show3d ? '' : ' mission-select__body--flat'}`}>
        {show3d && (
          <div className="mission-select__map">
            <Suspense fallback={<div className="mission-select__loading">Carregando mapa…</div>}>
              <MissionMapScene
                missions={MISSIONS}
                statuses={statuses}
                selectedId={selected.id}
                onSelect={setSelectedId}
                lowGraphics={lowGraphics}
                ambient={ambient}
                celebrateIds={celebrateIds}
              />
            </Suspense>
          </div>
        )}
        <ol className={`mission-list${show3d ? ' mission-list--hidden' : ''}`} aria-label="Lista de fases">
          {MISSIONS.map((mission, index) => {
            const status = statuses[mission.id]
            const name = mission.tutorial ? `Treinamento · ${STATUS_TEXT[status]}` : `Fase ${mission.order} · ${mission.title} · ${STATUS_TEXT[status]}`
            const available = status === 'available'
            return (
              <motion.li key={mission.id} custom={index} variants={gridWaveItem} initial="hidden" animate="visible">
                <motion.button
                  type="button"
                  className={`mission-list__item mission-list__item--${status}`}
                  aria-pressed={mission.id === selected.id}
                  aria-label={name}
                  onClick={() => setSelectedId(mission.id)}
                  {...PRESSABLE}
                  animate={available && ambient ? { boxShadow: ['0 0 0 0 rgba(65,133,214,0.6)', '0 0 0 8px rgba(65,133,214,0)'] } : undefined}
                  transition={available && ambient ? { duration: 1.6, repeat: Infinity, ease: EASINGS.easeOutCubic } : PRESSABLE.transition}
                >
                  <ListBadge status={status} order={mission.order} celebrate={celebrateIds.includes(mission.id)} />
                  <span className="mission-list__name">{mission.tutorial ? 'Treinamento' : mission.title}</span>
                </motion.button>
              </motion.li>
            )
          })}
        </ol>
        <div className="mission-select__detail">
          <AnimatePresence mode="wait" initial={false}>
            <MissionDetailCard key={selected.id} mission={selected} progress={save.missions[selected.id]} />
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
