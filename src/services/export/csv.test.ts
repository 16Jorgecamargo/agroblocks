import { assessmentCsv, attemptsCsv, missionsCsv, toCsv } from '@/services/export/csv'
import { MISSIONS } from '@/data/missions'
import { computeDashboard } from '@/features/dashboard/dashboardStats'
import { assignStudent, createInitialSave, recordAttempt, storeAssessment } from '@/game/progress/progression'
import { itemsForForm } from '@/data/assessment/items'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))

describe('csv', () => {
  it('adds BOM, uses semicolons and CRLF, quotes and guards formulas', () => {
    const csv = toCsv(['a', 'b'], [['x;y', 'diz "oi"'], ['=1+1', null], [-3, '+5']])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual(['a;b', '"x;y";"diz ""oi"""', "'=1+1;", "-3;'+5", ''])
  })

  it('exports attempts with the student name and concept', () => {
    let save = assignStudent(createInitialSave(refs, 'now'), { name: 'Ana Souza', school: 'Escola Azul' }, 'run-1')
    save = recordAttempt(
      save,
      {
        missionId: 'm1-first-harvest',
        timestamp: '2026-10-14T12:00:00.000Z',
        outcome: 'error',
        errorCode: 'HIT_OBSTACLE',
        actions: 3,
        blocks: 4,
        usage: { seeds: 0, water: 0, energy: 3 },
        efficiencyStars: null,
        pseudocode: '',
      },
      refs,
    )
    const lines = attemptsCsv(save, MISSIONS).slice(1).split('\r\n')
    expect(lines[0]).toBe(
      'aluno;missao;fase;conceito;tentativa;data_hora;resultado;codigo_erro;comandos;blocos;sementes;agua;energia;dicas;eficiencia',
    )
    expect(lines[1]).toBe('Ana Souza;m1-first-harvest;1;Sequenciamento;1;2026-10-14T12:00:00.000Z;erro;HIT_OBSTACLE;3;4;0;0;3;0;')
  })

  it('exports missions and assessment answers', () => {
    let save = createInitialSave(refs, 'now')
    const answers = Object.fromEntries(itemsForForm('pre').map((item) => [item.id, item.correctIndex]))
    save = storeAssessment(save, { form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers })
    expect(missionsCsv(computeDashboard(save, MISSIONS), null).slice(1).split('\r\n')).toHaveLength(MISSIONS.length + 2)
    const assessment = assessmentCsv(save).slice(1).split('\r\n')
    expect(assessment[0]).toBe('aluno;forma;item;par;conceito;resposta;correta')
    expect(assessment).toHaveLength(12)
    expect(assessment[1]).toMatch(/^;pre;seq-1-A;seq-1;Sequenciamento;1;sim$/)
  })
})
