import { MISSIONS } from '@/data/missions'
import { assessmentsCsv, attemptsCsv, studentsCsv } from '@/features/dashboard/dashboardCsv'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'

const rows = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students

describe('dashboard CSV', () => {
  it('exports one line per student', () => {
    const lines = studentsCsv(rows).replace('﻿', '').trim().split('\r\n')
    expect(lines[0]).toBe(
      'nome;escola;jogadas;tutorial;missoes_concluidas;mundos_concluidos;tentativas;dicas;erros;ultimo_acesso;garden_missoes;garden_pre;garden_pos;cornfield_missoes;cornfield_pre;cornfield_pos;orchard_missoes;orchard_pre;orchard_pos;greenhouse_missoes;greenhouse_pre;greenhouse_pos;barnyard_missoes;barnyard_pre;barnyard_pos;homestead_missoes;homestead_pre;homestead_pos',
    )
    expect(lines).toHaveLength(rows.length + 1)
  })

  it('exports every attempt with the student and run', () => {
    const lines = attemptsCsv(rows, MISSIONS).replace('﻿', '').trim().split('\r\n')
    expect(lines[0]).toBe('nome;escola;jogada;missao;mundo;missao_numero;tentativa;data_hora;resultado;codigo_erro;comandos;blocos;dicas;eficiencia;pseudocodigo')
    expect(lines.length - 1).toBe(rows.reduce((sum, row) => sum + row.attempts, 0))
  })

  it('exports assessment answers with correctness', () => {
    const csv = assessmentsCsv(rows)
    expect(csv).toContain('nome;escola;jogada;mundo;forma;item;habilidade;resposta;correta')
    expect(csv).toContain(';garden;pre;garden-1-A;')
    expect(csv).toMatch(/;sim\r\n|;nao\r\n/)
  })
})
