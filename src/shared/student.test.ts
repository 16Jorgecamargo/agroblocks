import { cleanText, normalizeKey, studentKeyOf, validateStudent } from './student.js'

describe('student helpers', () => {
  it('trims and collapses spaces', () => {
    expect(cleanText('  Ana   Maria \t Souza ')).toBe('Ana Maria Souza')
  })

  it('normalizes keys without accents, case or extra spaces', () => {
    expect(normalizeKey('  José   da SILVA ')).toBe('jose da silva')
    expect(studentKeyOf({ name: 'José da Silva', school: 'E.E. São João' })).toBe(studentKeyOf({ name: 'jose  da silva', school: 'e.e. sao joao' }))
  })

  it('requires a full name with two words of two letters', () => {
    expect(validateStudent({ name: 'Ana', school: 'Escola Azul' }).name).toBe('Digite seu nome completo (nome e sobrenome).')
    expect(validateStudent({ name: 'Ana S', school: 'Escola Azul' }).name).toBe('Digite seu nome completo (nome e sobrenome).')
    expect(validateStudent({ name: 'Ana Souza', school: 'Escola Azul' })).toEqual({ name: null, school: null })
    expect(validateStudent({ name: `Ana ${'a'.repeat(80)}`, school: 'Escola Azul' }).name).toBe('O nome pode ter até 80 caracteres.')
  })

  it('requires a school between 3 and 120 characters', () => {
    expect(validateStudent({ name: 'Ana Souza', school: ' ab ' }).school).toBe('Digite o nome da sua escola.')
    expect(validateStudent({ name: 'Ana Souza', school: 'a'.repeat(121) }).school).toBe('O nome da escola pode ter até 120 caracteres.')
  })
})
