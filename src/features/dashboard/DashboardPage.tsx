import { useMemo, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { BarChart } from '@/features/dashboard/BarChart'
import { computeDashboard } from '@/features/dashboard/dashboardStats'
import { createDemoSave } from '@/features/dashboard/demoData'
import { assessmentCsv, attemptsCsv, downloadText, missionsCsv } from '@/services/export/csv'
import { useProgressStore } from '@/stores/progressStore'
import './DashboardPage.css'

const STATUS_TEXT = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const

interface DashboardPageProps {
  token: string
  onUnauthorized: () => void
  onLogout: () => void
}

export function DashboardPage(props: DashboardPageProps) {
  void props
  const realSave = useProgressStore((store) => store.save)
  const [demo, setDemo] = useState(false)
  const demoSave = useMemo(() => createDemoSave(MISSIONS), [])
  const save = demo ? demoSave : realSave
  const stats = useMemo(() => computeDashboard(save, MISSIONS), [save])
  const realHasData = useMemo(() => computeDashboard(realSave, MISSIONS).hasData, [realSave])
  const canExport = !demo && realHasData
  const stamp = new Date().toISOString().slice(0, 10)
  const code = realSave.student ? realSave.student.name.replace(/\s+/g, '-') : 'anonimo'

  return (
    <div className="chrome-page">
      <PageHeader title="Painel do professor" subtitle="Acompanhamento das partidas registradas neste navegador." backTo="/" />
      <main className="dashboard">
        <p className="dashboard__banner" role="note">
          <Icon name="database" /> Dados registrados neste navegador. Não constituem resultados de pesquisa até serem coletados e analisados
          com o método descrito na documentação. Dados de uso não são, sozinhos, evidência de aprendizagem.
        </p>
        {demo && <p className="dashboard__demo">DADOS DE DEMONSTRAÇÃO — fictícios, não usar como resultado</p>}

        <div className="dashboard__toolbar">
          <button type="button" className="button" onClick={() => setDemo((value) => !value)}>
            {demo ? 'Voltar aos dados reais' : 'Carregar dados de demonstração'}
          </button>
          <button type="button" className="button" disabled={!canExport} onClick={() => downloadText(`agroblocks_tentativas_${code}_${stamp}.csv`, attemptsCsv(realSave, MISSIONS))}>
            <Icon name="database" /> Exportar tentativas (CSV)
          </button>
          <button type="button" className="button" disabled={!canExport} onClick={() => downloadText(`agroblocks_missoes_${code}_${stamp}.csv`, missionsCsv(computeDashboard(realSave, MISSIONS), realSave.student?.name ?? null))}>
            <Icon name="database" /> Exportar missões (CSV)
          </button>
          <button type="button" className="button" disabled={!canExport} onClick={() => downloadText(`agroblocks_avaliacao_${code}_${stamp}.csv`, assessmentCsv(realSave))}>
            <Icon name="database" /> Exportar avaliação (CSV)
          </button>
        </div>

        {!stats.hasData ? (
          <section className="card dashboard__empty">
            <h2>Ainda não existem registros neste navegador.</h2>
            <p>Os números aparecem depois que alguém jogar as missões ou responder às avaliações. Nenhum dado é inventado.</p>
          </section>
        ) : (
          <>
            <section className="dashboard__cards" aria-label="Resumo">
              <div className="card dashboard__metric" role="group" aria-label="Fases concluídas">
                <span>Fases concluídas</span>
                <strong>
                  {stats.completedPhases} de {stats.totalPhases}
                </strong>
              </div>
              <div className="card dashboard__metric" role="group" aria-label="Taxa de conclusão">
                <span>Taxa de conclusão</span>
                <strong>{Math.round(stats.completionRate * 100)}%</strong>
              </div>
              <div className="card dashboard__metric" role="group" aria-label="Tentativas registradas">
                <span>Tentativas registradas</span>
                <strong>{stats.totalAttempts}</strong>
              </div>
              <div className="card dashboard__metric" role="group" aria-label="Dicas usadas">
                <span>Dicas usadas</span>
                <strong>{stats.totalHints}</strong>
              </div>
            </section>

            <section className="dashboard__charts">
              <div className="card">
                <BarChart
                  title="Tentativas por missão"
                  description="Número de execuções registradas em cada missão."
                  series={stats.missions.map((row) => ({ label: row.title, values: [{ name: 'tentativas', value: row.attempts, tone: 'primary' }] }))}
                  max={Math.max(1, ...stats.missions.map((row) => row.attempts))}
                />
              </div>
              <div className="card">
                <BarChart
                  title="Erros mais frequentes"
                  description="Os tipos de erro que mais interromperam execuções."
                  series={stats.topErrors.map((error) => ({ label: error.label, values: [{ name: 'ocorrências', value: error.count, tone: 'secondary' }] }))}
                  max={Math.max(1, ...stats.topErrors.map((error) => error.count))}
                />
                {stats.topErrors.length === 0 && <p>Nenhum erro registrado.</p>}
              </div>
              <div className="card">
                <BarChart
                  title="Avaliação por conceito: pré × pós"
                  description="Percentual de acertos por conceito no pré-teste e no pós-teste."
                  series={stats.assessment.map((row) => ({
                    label: row.label,
                    values: [
                      { name: 'pré', value: row.pre, tone: 'secondary' },
                      { name: 'pós', value: row.post, tone: 'primary' },
                    ],
                  }))}
                  max={100}
                  unit="%"
                />
              </div>
            </section>

            <section className="card">
              <table className="dashboard__table">
                <caption>Resultados por missão</caption>
                <thead>
                  <tr>
                    <th scope="col">Missão</th>
                    <th scope="col">Conceito</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Tentativas</th>
                    <th scope="col">Sucessos</th>
                    <th scope="col">Erros</th>
                    <th scope="col">Dicas</th>
                    <th scope="col">Melhor (comandos)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.missions.map((row) => (
                    <tr key={row.missionId}>
                      <th scope="row">{row.title}</th>
                      <td>{row.conceptLabel}</td>
                      <td>{STATUS_TEXT[row.status]}</td>
                      <td>{row.attempts}</td>
                      <td>{row.successes}</td>
                      <td>{row.errors}</td>
                      <td>{row.hintsUsed}</td>
                      <td>{row.bestActions ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card">
              <table className="dashboard__table">
                <caption>Resultados por conceito pedagógico</caption>
                <thead>
                  <tr>
                    <th scope="col">Conceito</th>
                    <th scope="col">Tentativas</th>
                    <th scope="col">Taxa de sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.concepts.map((row) => (
                    <tr key={row.concept}>
                      <th scope="row">{row.label}</th>
                      <td>{row.attempts}</td>
                      <td>{row.attempts === 0 ? '—' : `${Math.round(row.successRate * 100)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
