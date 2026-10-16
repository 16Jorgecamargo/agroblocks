import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { BarChart } from '@/features/dashboard/BarChart'
import { assessmentsCsv, attemptsCsv, studentsCsv } from '@/features/dashboard/dashboardCsv'
import { buildDashboard, EMPTY_FILTERS, type DashboardFilters, type StudentRow } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'
import { StudentDetail } from '@/features/dashboard/StudentDetail'
import { StudentTable } from '@/features/dashboard/StudentTable'
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

const dash = (value: number | null) => (value === null ? '—' : String(value))

export function DashboardPage({ token, onUnauthorized, onLogout }: DashboardPageProps) {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [demo, setDemo] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS)
  const [openKey, setOpenKey] = useState<string | null>(null)
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
  const model = useMemo(() => buildDashboard(runs, MISSIONS, filters), [runs, filters])
  const open = model.students.find((row) => row.key === openKey) ?? null
  const stamp = new Date().toISOString().slice(0, 10)

  const exportAll = () => {
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

  const phaseMax = Math.max(1, ...model.phases.map((row) => Math.max(row.attemptsPerStudent, row.hintsPerStudent)))
  const showData = demo || (load.state === 'ready' && load.runs.length > 0)

  return (
    <div className="chrome-page">
      <PageHeader
        title="Painel do professor"
        subtitle="Todos os alunos que jogaram."
        backTo="/"
        actions={
          <div className="dashboard__actions">
            <button type="button" className="button" onClick={() => void refresh()} disabled={demo}>
              Atualizar
            </button>
            <button type="button" className="button" aria-pressed={demo} onClick={() => setDemo((value) => !value)}>
              Demonstração
            </button>
            <button type="button" className="button button--primary" onClick={exportAll} disabled={model.students.length === 0}>
              Exportar CSV
            </button>
            <button type="button" className="button button--ghost" onClick={onLogout}>
              Sair
            </button>
          </div>
        }
      />
      <main className="dashboard">
        {demo && <p className="dashboard__demo">DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado</p>}
        {!demo && load.state === 'loading' && (
          <p className="card" role="status">
            Carregando dados…
          </p>
        )}
        {!demo && load.state === 'error' && (
          <section className="card dashboard__empty">
            <h2>Não foi possível carregar os dados.</h2>
            <button type="button" className="button" onClick={() => void refresh()}>
              Tentar de novo
            </button>
          </section>
        )}
        {!demo && load.state === 'ready' && load.runs.length === 0 && (
          <section className="card dashboard__empty">
            <h2>Nenhum aluno enviou dados ainda.</h2>
            <p>Os alunos aparecem aqui assim que se cadastram e começam a jogar.</p>
          </section>
        )}
        {showData && (
          <>
            <section className="card dashboard__filters" aria-label="Filtros">
              <label className="field">
                <span className="field__label">Escola</span>
                <select value={filters.school ?? ''} onChange={(event) => setFilters({ ...filters, school: event.target.value || null })}>
                  <option value="">Todas as escolas</option>
                  {model.schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">Buscar aluno</span>
                <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
              </label>
              <label className="field">
                <span className="field__label">De</span>
                <input type="date" value={filters.from ?? ''} onChange={(event) => setFilters({ ...filters, from: event.target.value || null })} />
              </label>
              <label className="field">
                <span className="field__label">Até</span>
                <input type="date" value={filters.to ?? ''} onChange={(event) => setFilters({ ...filters, to: event.target.value || null })} />
              </label>
              <button type="button" className="button" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpar filtros
              </button>
            </section>

            <section className="dashboard__cards" aria-label="Resumo">
              {[
                ['Alunos', String(model.summary.students)],
                ['Escolas', String(model.summary.schools)],
                ['Jogadas', String(model.summary.runs)],
                ['Fases concluídas (média)', `${model.summary.avgCompletedPhases} de ${model.phases.length - 1}`],
                ['Tentativas', String(model.summary.attempts)],
                ['Dicas', String(model.summary.hints)],
                ['Tutorial', `${model.summary.tutorial.completed} concluíram · ${model.summary.tutorial.skipped} pularam · ${model.summary.tutorial.unfinished} não terminaram`],
                ['Avaliação pré × pós', `${dash(model.summary.avgPre)} → ${dash(model.summary.avgPost)} (ganho ${dash(model.summary.avgGain)})`],
              ].map(([label, text]) => (
                <div key={label} className="card dashboard__metric" role="group" aria-label={label}>
                  <span>{label}</span>
                  <strong>{text}</strong>
                </div>
              ))}
            </section>

            <section className="dashboard__charts">
              <div className="card">
                <BarChart
                  title="Conclusão por fase"
                  description="Quantos alunos concluíram cada fase."
                  series={model.phases.map((row) => ({ label: row.title, values: [{ name: 'alunos', value: row.completed, tone: 'primary' }] }))}
                  max={Math.max(1, model.summary.students)}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Tentativas e dicas por fase"
                  description="Média por aluno de tentativas e dicas em cada fase."
                  series={model.phases.map((row) => ({
                    label: row.title,
                    values: [
                      { name: 'tentativas', value: row.attemptsPerStudent, tone: 'primary' },
                      { name: 'dicas', value: row.hintsPerStudent, tone: 'secondary' },
                    ],
                  }))}
                  max={phaseMax}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Erros mais comuns"
                  description="Os erros que mais interromperam os programas."
                  series={model.topErrors.map((error) => ({ label: error.label, values: [{ name: 'ocorrências', value: error.count, tone: 'secondary' }] }))}
                  max={Math.max(1, ...model.topErrors.map((error) => error.count))}
                />
                {model.topErrors.length === 0 && <p>Nenhum erro registrado.</p>}
              </div>
              <div className="card">
                <BarChart
                  title="Pré × pós por escola"
                  description="Média de acertos (0 a 10) no pré-teste e no pós-teste."
                  series={model.schoolScores.map((row) => ({
                    label: row.school,
                    values: [
                      { name: 'pré', value: row.pre, tone: 'secondary' },
                      { name: 'pós', value: row.post, tone: 'primary' },
                    ],
                  }))}
                  max={10}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Estrelas por fase"
                  description="Quantos alunos ganharam 1, 2 ou 3 estrelas de eficiência."
                  series={model.phases.map((row) => ({
                    label: row.title,
                    values: [
                      { name: '1 estrela', value: row.stars[0], tone: 'secondary' },
                      { name: '2 estrelas', value: row.stars[1], tone: 'secondary' },
                      { name: '3 estrelas', value: row.stars[2], tone: 'primary' },
                    ],
                  }))}
                  max={Math.max(1, model.summary.students)}
                />
              </div>
            </section>

            <StudentTable rows={model.students} onOpen={(row: StudentRow) => setOpenKey(row.key)} />
          </>
        )}
      </main>
      <StudentDetail student={open} demo={demo} onClose={() => setOpenKey(null)} onDeleteRun={removeRun} />
    </div>
  )
}
