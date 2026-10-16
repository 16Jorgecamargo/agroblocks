import { MISSIONS } from '@/data/missions'
import { assessmentsCsv, attemptsCsv, studentsCsv } from '@/features/dashboard/dashboardCsv'
import { buildDashboard, EMPTY_FILTERS } from '@/features/dashboard/dashboardModel'
import { createDemoRuns } from '@/features/dashboard/demoRuns'

const rows = buildDashboard(createDemoRuns(MISSIONS), MISSIONS, EMPTY_FILTERS).students

describe('dashboard CSV', () => {
  it('exports one line per student', () => {
    const lines = studentsCsv(rows).replace('﻿', '').trim().split('\r\n')
    expect(lines[0]).toBe('nome;escola;jogadas;tutorial;fases_concluidas;tentativas;dicas;erros;pre;pos;ganho;ultimo_acesso')
    expect(lines).toHaveLength(rows.length + 1)
  })

  it('exports every attempt with the student and run', () => {
    const lines = attemptsCsv(rows, MISSIONS).replace('﻿', '').trim().split('\r\n')
    expect(lines[0]).toBe('nome;escola;jogada;missao;fase;tentativa;data_hora;resultado;codigo_erro;comandos;blocos;dicas;eficiencia;pseudocodigo')
    expect(lines.length - 1).toBe(rows.reduce((sum, row) => sum + row.attempts, 0))
  })

  it('exports assessment answers with correctness', () => {
    const csv = assessmentsCsv(rows)
    expect(csv).toContain('nome;escola;jogada;forma;item;conceito;resposta;correta')
    expect(csv).toMatch(/;sim\r\n|;nao\r\n/)
  })
})
