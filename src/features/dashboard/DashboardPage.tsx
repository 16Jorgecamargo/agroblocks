import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { MISSIONS } from '@/data/missions'
import { ClassField } from '@/features/dashboard/ClassField'
import { assessmentsCsv, attemptsCsv, studentsCsv } from '@/features/dashboard/dashboardCsv'
import { buildDashboard, EMPTY_FILTERS, type DashboardFilters, type DashboardModel, type StudentRow } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { ErrorList, PhaseEffort, ScoreRanges } from '@/features/dashboard/Insights'
import { StudentDetail } from '@/features/dashboard/StudentDetail'
import { useDashboardTheme } from '@/features/dashboard/useDashboardTheme'
import { downloadText } from '@/services/export/csv'
import { deleteRun, fetchRuns } from '@/services/teacher/teacherApi'
import type { RunSnapshot } from '@/shared/runSnapshot'
import './DashboardPage.css'

interface DashboardPageProps {
  token: string
  onUnauthorized: () => void
  onLogout: () => void
}

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; runs: RunSnapshot[] }

const INTRO_MS = 1400
const decimal = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

function Summary({ model }: { model: DashboardModel }) {
  const { summary } = model
  const phaseCount = model.phases.length - 1
  const tutorialTotal = Math.max(1, summary.students)
  const segments = [
    { key: 'completed', count: summary.tutorial.completed },
    { key: 'skipped', count: summary.tutorial.skipped },
    { key: 'unfinished', count: summary.tutorial.unfinished },
  ]
  return (
    <section className="summary" aria-label="Resumo">
      <div className="figure" role="group" aria-label="Alunos">
        <span className="figure__label">Alunos</span>
        <strong className="figure__value">{summary.students}</strong>
        <span className="figure__note">
          {plural(summary.schools, 'escola', 'escolas')}, {plural(summary.runs, 'jogada', 'jogadas')}
        </span>
      </div>
      <div className="figure" role="group" aria-label="Fases concluídas">
        <span className="figure__label">Fases concluídas</span>
        <strong className="figure__value">
          {decimal(summary.avgCompletedPhases)}
          <span className="figure__unit"> de {phaseCount}</span>
        </strong>
        <span className="figure__note">em média, por aluno</span>
      </div>
      <div className="figure" role="group" aria-label="Tutorial">
        <span className="figure__label">Tutorial</span>
        <span className="stack" aria-hidden="true">
          {segments.map((segment) => (
            <span key={segment.key} className={`stack__part stack__part--${segment.key}`} style={{ flexGrow: segment.count / tutorialTotal }} />
          ))}
        </span>
        <span className="figure__note figure__note--keys">
          <span className="key key--completed">{summary.tutorial.completed} {summary.tutorial.completed === 1 ? 'concluiu' : 'concluíram'}</span>
          <span className="key key--skipped">{summary.tutorial.skipped} {summary.tutorial.skipped === 1 ? 'pulou' : 'pularam'}</span>
          <span className="key key--unfinished">{summary.tutorial.unfinished} não {summary.tutorial.unfinished === 1 ? 'terminou' : 'terminaram'}</span>
        </span>
      </div>
      <div className="figure" role="group" aria-label="Avaliação">
        <span className="figure__label">Avaliação</span>
        {summary.avgPre === null && summary.avgPost === null ? (
          <span className="figure__note">Ninguém respondeu às avaliações ainda.</span>
        ) : (
          <>
            <strong className="figure__value">
              {summary.avgPre === null ? '—' : decimal(summary.avgPre)}
              <span className="figure__arrow"> → </span>
              {summary.avgPost === null ? '—' : decimal(summary.avgPost)}
            </strong>
            <span className="figure__note">{summary.avgGain === null ? 'acertos de 10, pré e pós' : `acertos de 10, ganho médio de ${decimal(summary.avgGain)}`}</span>
          </>
        )}
      </div>
    </section>
  )
}

export function DashboardPage({ token, onUnauthorized, onLogout }: DashboardPageProps) {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [demo, setDemo] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [intro, setIntro] = useState(true)
  const [theme, toggleTheme] = useDashboardTheme()
  const demoRuns = useMemo(() => createDemoRuns(MISSIONS), [])

  const refresh = useCallback(async () => {
    setLoad({ state: 'loading' })
    const result = await fetchRuns(token)
    if (result.ok) {
      setLoad({ state: 'ready', runs: result.runs })
      return
    }
    if (result.reason === 'unauthorized') {
      onUnauthorized()
      return
    }
    setLoad({ state: 'error' })
  }, [token, onUnauthorized])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const runs = demo ? demoRuns : load.state === 'ready' ? load.runs : []
  const showData = runs.length > 0

  useEffect(() => {
    if (!showData) return
    setIntro(true)
    const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
    return () => window.clearTimeout(timer)
  }, [showData, demo])

  const model = useMemo(() => buildDashboard(runs, MISSIONS, filters), [runs, filters])
  const open = model.students.find((row) => row.key === openKey) ?? null
  const closeDetail = useCallback(() => setOpenKey(null), [])
  const filtered = filters.school !== null || filters.search !== '' || filters.from !== null || filters.to !== null

  const exportAll = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadText(`agroblocks_alunos_${stamp}.csv`, studentsCsv(model.students))
    downloadText(`agroblocks_tentativas_${stamp}.csv`, attemptsCsv(model.students, MISSIONS))
    downloadText(`agroblocks_avaliacoes_${stamp}.csv`, assessmentsCsv(model.students))
  }

  const removeRun = async (runId: string) => {
    if (demo) return
    const result = await deleteRun(token, runId)
    if (!result.ok && result.reason === 'unauthorized') {
      onUnauthorized()
      return
    }
    await refresh()
  }

  return (
    <div className="dash" data-theme={theme}>
      <header className="dash__top">
        <Link to="/" className="dash__back">
          Início
        </Link>
        <div className="dash__titles">
          <h1 className="dash__title">Painel do professor</h1>
          <p className="dash__lede">
            {showData
              ? `${plural(model.summary.students, 'aluno', 'alunos')} de ${plural(model.summary.schools, 'escola', 'escolas')}${filtered ? ' nos filtros escolhidos' : ''}.`
              : 'Acompanhe quem já jogou e onde cada aluno parou.'}
          </p>
        </div>
        <div className="dash__actions">
          <button type="button" className="dash-button dash-button--quiet" onClick={() => void refresh()} disabled={demo}>
            Atualizar
          </button>
          <button type="button" className="dash-button dash-button--primary" onClick={exportAll} disabled={model.students.length === 0}>
            Exportar CSV
          </button>
          <button type="button" className="dash-button dash-button--quiet" onClick={toggleTheme}>
            {theme === 'light' ? 'Tema escuro' : 'Tema claro'}
          </button>
          <button type="button" className="dash-button dash-button--quiet" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="dash__main">
        {demo && (
          <div className="dash__demo" role="status">
            <p>Você está vendo dados de exemplo, inventados. Eles não são resultado de nenhuma turma.</p>
            <button type="button" className="dash-button dash-button--quiet" onClick={() => setDemo(false)}>
              Voltar aos dados reais
            </button>
          </div>
        )}

        {!demo && load.state === 'loading' && (
          <p className="dash__state" role="status">
            Carregando os dados da turma…
          </p>
        )}
        {!demo && load.state === 'error' && (
          <section className="dash__state">
            <h2>Não foi possível carregar os dados.</h2>
            <p>Confira a conexão com a internet e tente de novo.</p>
            <button type="button" className="dash-button dash-button--primary" onClick={() => void refresh()}>
              Tentar de novo
            </button>
          </section>
        )}
        {!demo && load.state === 'ready' && load.runs.length === 0 && (
          <section className="dash__state">
            <h2>Nenhum aluno enviou dados ainda.</h2>
            <p>Os alunos aparecem aqui assim que se cadastram e começam a jogar. Para conhecer o painel antes disso, abra os dados de exemplo.</p>
            <button type="button" className="dash-button dash-button--quiet" aria-pressed={demo} onClick={() => setDemo(true)}>
              Dados de exemplo
            </button>
          </section>
        )}

        {showData && (
          <>
            <section className="toolbar" aria-label="Filtros">
              <label className="dash-field dash-field--wide">
                <span>Escola</span>
                <select value={filters.school ?? ''} onChange={(event) => setFilters({ ...filters, school: event.target.value || null })}>
                  <option value="">Todas as escolas</option>
                  {model.schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dash-field dash-field--wide">
                <span>Buscar aluno</span>
                <input type="search" placeholder="Nome do aluno" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
              </label>
              <label className="dash-field">
                <span>De</span>
                <input type="date" value={filters.from ?? ''} onChange={(event) => setFilters({ ...filters, from: event.target.value || null })} />
              </label>
              <label className="dash-field">
                <span>Até</span>
                <input type="date" value={filters.to ?? ''} onChange={(event) => setFilters({ ...filters, to: event.target.value || null })} />
              </label>
              <button type="button" className="dash-button dash-button--quiet" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!filtered}>
                Limpar filtros
              </button>
              {!demo && (
                <button type="button" className="dash-button dash-button--quiet toolbar__demo" aria-pressed={demo} onClick={() => setDemo(true)}>
                  Dados de exemplo
                </button>
              )}
            </section>

            {model.students.length === 0 ? (
              <section className="dash__state">
                <h2>Nenhum aluno nesses filtros.</h2>
                <p>Mude a escola, o nome ou o período, ou limpe os filtros.</p>
              </section>
            ) : (
              <>
                <Summary model={model} />

                <section className="block" aria-labelledby="field-title">
                  <div className="block__head">
                    <h2 id="field-title" className="block__title">
                      Canteiro da turma
                    </h2>
                    <ul className="legend" aria-label="Legenda">
                      <li>
                        <span className="plot plot--empty plot--mini" aria-hidden="true" /> Não começou
                      </li>
                      <li>
                        <span className="plot plot--trying plot--mini" aria-hidden="true" /> Tentando, com o número de tentativas
                      </li>
                      <li>
                        <span className="plot plot--done plot--mini" aria-hidden="true" /> Concluiu, com as estrelas
                      </li>
                    </ul>
                  </div>
                  <p className="block__hint">Cada linha é um aluno. Abra um aluno para ver cada tentativa, o pseudocódigo e as respostas.</p>
                  <ClassField rows={model.students} missions={MISSIONS} phases={model.phases} intro={intro} onOpen={(row: StudentRow) => setOpenKey(row.key)} />
                </section>

                <div className="pair">
                  <section className="block" aria-labelledby="errors-title">
                    <h2 id="errors-title" className="block__title">
                      Onde a turma travou
                    </h2>
                    <p className="block__hint">Os erros que mais pararam os programas.</p>
                    <ErrorList errors={model.topErrors} />
                  </section>
                  <section className="block" aria-labelledby="scores-title">
                    <h2 id="scores-title" className="block__title">
                      Pré-teste e pós-teste por escola
                    </h2>
                    <p className="block__hint">Média de acertos, de 0 a 10.</p>
                    <ScoreRanges rows={model.schoolScores} />
                  </section>
                </div>

                <section className="block" aria-labelledby="effort-title">
                  <h2 id="effort-title" className="block__title">
                    Tentativas e dicas por fase
                  </h2>
                  <p className="block__hint">Média por aluno. Muitas tentativas e dicas na mesma fase mostram onde a turma precisa de ajuda.</p>
                  <PhaseEffort phases={model.phases} />
                </section>
              </>
            )}
          </>
        )}
      </main>
      <StudentDetail student={open} demo={demo} onClose={closeDetail} onDeleteRun={removeRun} />
    </div>
  )
}
