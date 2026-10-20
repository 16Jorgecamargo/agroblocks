import { lazy, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { getWorld, missionsOfWorld, WORLDS } from '@/data/worlds'
import { MissionDetailCard } from '@/features/mission-select/MissionDetailCard'
import { nodeKey, nodeState, trailNodes, type NodeState, type TrailNode } from '@/features/mission-select/trailNodes'
import { WorldDots, type WorldProgressState } from '@/features/mission-select/WorldDots'
import { currentWorld, isWorldOpen, worldStep } from '@/game/progress/progression'
import type { SaveData } from '@/game/progress/types'
import type { WorldId } from '@/game/worlds/worldTypes'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { hasWebGL } from '@/render/hasWebGL'
import { SceneWithSplash } from '@/render/SceneWithSplash'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './MissionSelectPage.css'

const WorldMapScene = lazy(() => import('@/features/mission-select/WorldMapScene'))

const REFS = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

const STATE_TEXT: Record<NodeState, string> = { done: 'Concluída', current: 'Agora', open: 'Disponível', locked: 'Bloqueada' }

function completedIn(save: SaveData, world: WorldId): number {
  return missionsOfWorld(world, MISSIONS).filter((mission) => save.missions[mission.id]?.status === 'completed').length
}

function worldState(save: SaveData, world: WorldId): WorldProgressState {
  if (!isWorldOpen(save, world, REFS)) return 'fechado'
  return worldStep(save, world, REFS).kind === 'done' ? 'concluído' : 'em andamento'
}

function nodeName(node: TrailNode, state: NodeState): string {
  if (node.kind === 'mission') return `Missão ${node.mission.slot} · ${node.mission.title} · ${STATE_TEXT[state]}`
  return `${node.kind === 'preTest' ? 'Prova inicial' : 'Prova final'} · ${STATE_TEXT[state]}`
}

function initialSelection(save: SaveData, world: WorldId, nodes: TrailNode[]): string {
  const current = nodes.find((node) => nodeState(save, world, node, REFS) === 'current')
  return nodeKey(current ?? nodes[0])
}

export function MissionSelectPage() {
  const save = useProgressStore((store) => store.save)
  const { lowGraphics } = useSettingsStore((store) => store.settings)
  const { ambient } = useMotionPrefs()
  const webgl = useMemo(() => hasWebGL(), [])
  const [worldId, setWorldId] = useState<WorldId>(() => currentWorld(save, REFS))
  const nodes = useMemo(() => trailNodes(worldId, MISSIONS), [worldId])
  const [selected, setSelected] = useState(() => initialSelection(save, worldId, nodes))
  const world = getWorld(worldId)
  const open = isWorldOpen(save, worldId, REFS)
  const states = nodes.map((node) => nodeState(save, worldId, node, REFS))
  const selectedIndex = Math.max(0, nodes.findIndex((node) => nodeKey(node) === selected))
  const selectedNode = nodes[selectedIndex]
  const previous = WORLDS.find((candidate) => candidate.order === world.order - 1)
  const next = WORLDS.find((candidate) => candidate.order === world.order + 1)
  const dots = Object.fromEntries(WORLDS.map((item) => [item.id, { state: worldState(save, item.id), completed: completedIn(save, item.id) }])) as Record<
    WorldId,
    { state: WorldProgressState; completed: number }
  >

  useEffect(() => {
    if (webgl) void import('@/render/models/Model').then((module) => module.preloadModels())
  }, [webgl])

  const goTo = (target: WorldId) => {
    setWorldId(target)
    setSelected(initialSelection(save, target, trailNodes(target, MISSIONS)))
  }

  return (
    <div className="chrome-page mission-select">
      <PageHeader title="Seus desafios" subtitle="Cada mundo é uma fazenda. Siga a trilha e conclua as 10 missões para abrir o próximo." backTo="/" />
      <div className="world-stage">
        {webgl && (
          <div className="world-stage__map">
            <SceneWithSplash label="Carregando a fazenda…">
              {(onReady) => (
                <WorldMapScene world={worldId} nodes={nodes} states={states} selected={selected} onSelect={setSelected} lowGraphics={lowGraphics} ambient={ambient} onReady={onReady} />
              )}
            </SceneWithSplash>
          </div>
        )}
        <ol className={`world-trail${webgl ? ' visually-hidden' : ''}`} aria-label={`Trilha de ${world.name}`}>
          {nodes.map((node, index) => (
            <li key={nodeKey(node)}>
              <button
                type="button"
                className={`world-trail__item world-trail__item--${states[index]}`}
                aria-pressed={nodeKey(node) === selected}
                aria-label={nodeName(node, states[index])}
                onClick={() => setSelected(nodeKey(node))}
              >
                {node.kind === 'mission' ? node.mission.slot : node.kind === 'preTest' ? 'Início' : 'Fim'}
              </button>
            </li>
          ))}
        </ol>
        <div className="world-stage__label">
          <strong>{`Mundo ${world.order}: ${world.name}`}</strong>
          <span>{`${world.conceptLabel} · ${completedIn(save, worldId)} de 10 missões`}</span>
          <span className="world-stage__bar" aria-hidden="true">
            <i style={{ width: `${completedIn(save, worldId) * 10}%` }} />
          </span>
        </div>
        <button type="button" className="world-stage__nav world-stage__nav--prev" aria-label="Mundo anterior" disabled={!previous} onClick={() => previous && goTo(previous.id)}>
          ‹
        </button>
        <button type="button" className="world-stage__nav world-stage__nav--next" aria-label="Próximo mundo" disabled={!next} onClick={() => next && goTo(next.id)}>
          ›
        </button>
        {!open && previous && (
          <div className="world-stage__veil">
            <span aria-hidden="true">🔒</span>
            <p>{`Conclua o mundo ${previous.name} para abrir este`}</p>
          </div>
        )}
        {open && (
          <div className="world-stage__card">
            <AnimatePresence mode="wait" initial={false}>
              <MissionDetailCard
                key={nodeKey(selectedNode)}
                world={world}
                node={selectedNode}
                state={states[selectedIndex]}
                progress={selectedNode.kind === 'mission' ? save.missions[selectedNode.mission.id] : undefined}
              />
            </AnimatePresence>
          </div>
        )}
      </div>
      <WorldDots worlds={WORLDS} states={dots} current={worldId} onSelect={goTo} />
    </div>
  )
}
