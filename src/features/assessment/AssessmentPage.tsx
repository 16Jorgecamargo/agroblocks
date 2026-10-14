import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { itemsForForm } from '@/data/assessment/items'
import { MiniGrid } from '@/features/assessment/MiniGrid'
import { percent, scoreResponse } from '@/game/assessment/scoring'
import { ASSESSMENT_CONCEPT_LABELS, ASSESSMENT_CONCEPTS } from '@/game/assessment/types'
import type { AssessmentForm, AssessmentResponse } from '@/game/progress/types'
import { useProgressStore } from '@/stores/progressStore'
import './AssessmentPage.css'

const FORM_BY_SLUG: Record<string, AssessmentForm> = { pre: 'pre', pos: 'post' }
const FINAL_MISSION = 'm6-efficient-farm'

function Comparison({ pre, post }: { pre: AssessmentResponse | null; post: AssessmentResponse }) {
  const preScores = pre ? scoreResponse(pre) : null
  const postScores = scoreResponse(post)
  return (
    <table className="assessment__table">
      <caption>Acertos por conceito (dados deste navegador)</caption>
      <thead>
        <tr>
          <th scope="col">Conceito</th>
          <th scope="col">Pré-teste</th>
          <th scope="col">Pós-teste</th>
        </tr>
      </thead>
      <tbody>
        {ASSESSMENT_CONCEPTS.map((concept) => (
          <tr key={concept}>
            <th scope="row">{ASSESSMENT_CONCEPT_LABELS[concept]}</th>
            <td>{preScores ? `${percent(preScores[concept])}%` : '—'}</td>
            <td>{postScores ? `${percent(postScores[concept])}%` : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function AssessmentPage() {
  const { form: slug = '' } = useParams()
  const form = FORM_BY_SLUG[slug]
  const save = useProgressStore((store) => store.save)
  const storeAssessment = useProgressStore((store) => store.storeAssessment)
  const [stage, setStage] = useState<'intro' | 'questions' | 'done'>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [startedAt, setStartedAt] = useState('')

  if (!form) return <Navigate to="/" replace />

  const items = itemsForForm(form)
  const title = form === 'pre' ? 'Avaliação inicial' : 'Avaliação final'
  const existing = save.assessments[form]
  const postLocked = form === 'post' && save.missions[FINAL_MISSION]?.status !== 'completed'

  const finish = (skipped: boolean) => {
    const now = new Date().toISOString()
    storeAssessment({ form, startedAt: startedAt || now, completedAt: now, skipped, answers: skipped ? {} : answers })
    setStage('done')
  }

  const body = () => {
    if (stage === 'done' || (existing && stage === 'intro')) {
      const response = save.assessments[form]
      return (
        <section className="card assessment__card">
          <h2>Obrigado!</h2>
          {response?.skipped ? (
            <p>A avaliação inicial foi pulada. Você pode jogar normalmente.</p>
          ) : (
            <p>Suas respostas foram salvas neste navegador, sem nome nem dados pessoais.</p>
          )}
          {form === 'post' && response && <Comparison pre={save.assessments.pre} post={response} />}
          <Link to="/missoes" className="button button--primary">
            Ir para as missões
          </Link>
        </section>
      )
    }
    if (postLocked) {
      return (
        <section className="card assessment__card">
          <h2>Ainda não disponível</h2>
          <p>Conclua a Fase 6 (Fazenda eficiente) para liberar a avaliação final.</p>
          <Link to="/missoes" className="button">
            Ver missões
          </Link>
        </section>
      )
    }
    if (stage === 'intro') {
      return (
        <section className="card assessment__card">
          <h2>{title}</h2>
          <p>São 10 questões curtas sobre sequência, repetição, condições, erros e leitura de algoritmos.</p>
          <ul>
            <li>Não vale nota e não há tempo limite.</li>
            <li>Você não verá se acertou durante a avaliação.</li>
            <li>As respostas ficam salvas só neste navegador, sem dados pessoais.</li>
          </ul>
          <div className="assessment__actions">
            {form === 'pre' && (
              <button type="button" className="button" onClick={() => finish(true)}>
                Pular por enquanto
              </button>
            )}
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setStartedAt(new Date().toISOString())
                setStage('questions')
              }}
            >
              Começar
            </button>
          </div>
        </section>
      )
    }
    const item = items[index]
    const selected = answers[item.id]
    const last = index === items.length - 1
    return (
      <section className="card assessment__card" aria-labelledby="question-prompt">
        <p className="assessment__counter">
          Questão {index + 1} de {items.length}
        </p>
        <progress max={items.length} value={index} aria-hidden="true" />
        <h2 id="question-prompt" className="assessment__prompt">
          {item.prompt}
        </h2>
        {item.grid && <MiniGrid grid={item.grid} />}
        {item.code && <pre className="assessment__code">{item.code}</pre>}
        <fieldset className="assessment__options">
          <legend className="visually-hidden">Alternativas</legend>
          {item.options.map((option, optionIndex) => (
            <label key={option} className={`assessment__option${selected === optionIndex ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name={item.id}
                checked={selected === optionIndex}
                onChange={() => setAnswers((current) => ({ ...current, [item.id]: optionIndex }))}
              />
              {option}
            </label>
          ))}
        </fieldset>
        <div className="assessment__actions">
          <button type="button" className="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Anterior
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={selected === undefined}
            onClick={() => (last ? finish(false) : setIndex(index + 1))}
          >
            {last ? 'Concluir' : 'Próxima'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="chrome-page">
      <PageHeader title={title} subtitle="Instrumento diagnóstico do projeto AgroBlocks." backTo="/" />
      <main className="assessment">{body()}</main>
    </div>
  )
}
