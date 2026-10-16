export interface StudentInfo {
  name: string
  school: string
}

export interface TutorialRecord {
  status: 'completed' | 'skipped'
  step: number
  at: string
}

export function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeKey(value: string): string {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function studentKeyOf(student: StudentInfo): string {
  return `${normalizeKey(student.name)}|${normalizeKey(student.school)}`
}

export function validateStudent(input: StudentInfo): { name: string | null; school: string | null } {
  const name = cleanText(input.name)
  const school = cleanText(input.school)
  const words = name.split(' ').filter((word) => word.replace(/[^\p{L}]/gu, '').length >= 2)
  return {
    name: name.length > 80 ? 'O nome pode ter até 80 caracteres.' : words.length < 2 ? 'Digite seu nome completo (nome e sobrenome).' : null,
    school: school.length > 120 ? 'O nome da escola pode ter até 120 caracteres.' : school.length < 3 ? 'Digite o nome da sua escola.' : null,
  }
}
