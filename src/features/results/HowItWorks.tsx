import { useMemo } from 'react'
import { motion } from 'motion/react'
import { BlockPreview } from '@/blocks/editor/BlockPreview'
import { serializeWorkspace } from '@/blocks/serializer/serializeWorkspace'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import { Icon } from '@/components/icons/Icon'
import { describeRobotSteps } from '@/features/results/robotSteps'
import { CONCEPT_TIPS } from '@/features/results/resultsLogic'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { rowExpand, staggerContainer, staggerItem } from '@/motion/presets'

interface HowItWorksProps {
  mission: MissionDefinition
  savedProgram: string | null
  pseudocode: string
  reference: { actions: number; blocks: number; pseudocode: string }
  attempt: { actions: number; blocks: number }
}

export function HowItWorks({ mission, savedProgram, pseudocode, reference, attempt }: HowItWorksProps) {
  const parsed = useMemo(() => {
    if (!savedProgram) return null
    try {
      const json = JSON.parse(savedProgram) as WorkspaceJson
      const result = serializeWorkspace(json)
      return result.ok ? { json, program: result.program } : null
    } catch {
      return null
    }
  }, [savedProgram])
  const steps = parsed ? describeRobotSteps(parsed.program) : []

  return (
    <motion.section className="how-it-works" aria-labelledby="explain-title" variants={rowExpand} initial="hidden" animate="visible" exit="hidden">
      <h2 id="explain-title">Como funciona?</h2>
      <p className="how-it-works__lead">{mission.solutionExplanation}</p>
      <div className="how-it-works__columns how-it-works__code">
        <figure>
          <figcaption>O pseudocódigo que você fez para passar</figcaption>
          <pre>{pseudocode}</pre>
        </figure>
        <figure>
          <figcaption>Solução da missão em pseudocódigo</figcaption>
          <pre>{reference.pseudocode}</pre>
          <p className="how-it-works__note">Existem outras soluções corretas.</p>
        </figure>
      </div>
      <div className="how-it-works__grid">
        {parsed && (
          <div className="how-it-works__blocks">
            <BlockPreview json={parsed.json} label={`Blocos do seu programa. ${pseudocode}`} />
          </div>
        )}
        <div className="how-it-works__steps">
          <h3>O que o robô fez?</h3>
          {steps.length > 0 ? (
            <motion.ol variants={staggerContainer(0.12, 0.3)} initial="hidden" animate="visible">
              {steps.map((step, index) => (
                <motion.li key={index} variants={staggerItem}>
                  <span className="how-it-works__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  {step}
                </motion.li>
              ))}
            </motion.ol>
          ) : (
            <p>Veja o pseudocódigo acima.</p>
          )}
        </div>
      </div>
      <aside className="how-it-works__tip">
        <Icon name="bulb" size={28} />
        <div>
          <strong>Dica</strong>
          <p>{CONCEPT_TIPS[mission.concept]}</p>
        </div>
      </aside>
      <table className="results__table">
        <caption>Comparação com a solução da missão</caption>
        <thead>
          <tr>
            <th scope="col">Medida</th>
            <th scope="col">Sua solução</th>
            <th scope="col">Solução da missão</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Comandos executados</th>
            <td>{attempt.actions}</td>
            <td>{reference.actions}</td>
          </tr>
          <tr>
            <th scope="row">Blocos usados</th>
            <td>{attempt.blocks}</td>
            <td>{reference.blocks}</td>
          </tr>
        </tbody>
      </table>
    </motion.section>
  )
}
