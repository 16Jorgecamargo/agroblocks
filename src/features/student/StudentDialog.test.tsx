import { fireEvent, render, screen } from '@testing-library/react'
import { StudentDialog } from '@/features/student/StudentDialog'
import { recentSchools, rememberSchool, SCHOOLS_KEY } from '@/services/storage/schoolHistory'

function setup() {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(<StudentDialog open onCancel={onCancel} onConfirm={onConfirm} />)
  const name = screen.getByLabelText('Nome completo')
  const school = screen.getByLabelText('Escola')
  return { onConfirm, onCancel, name, school, start: screen.getByRole('button', { name: 'Começar' }) }
}

describe('StudentDialog', () => {
  beforeEach(() => window.localStorage.removeItem(SCHOOLS_KEY))

  it('explains what is sent to the teacher', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Quem está jogando?' })).toHaveTextContent('serão enviados ao professor')
  })

  it('keeps Começar disabled until the name and school are valid and shows errors after leaving a field', () => {
    const { name, school, start } = setup()
    expect(start).toBeDisabled()
    fireEvent.change(name, { target: { value: 'Ana' } })
    fireEvent.blur(name)
    expect(screen.getByText('Digite seu nome completo (nome e sobrenome).')).toBeInTheDocument()
    fireEvent.change(name, { target: { value: 'Ana Souza' } })
    fireEvent.change(school, { target: { value: 'Escola Azul' } })
    expect(start).toBeEnabled()
  })

  it('confirms a cleaned student and remembers the school', () => {
    const { name, school, start, onConfirm } = setup()
    fireEvent.change(name, { target: { value: '  Ana   Souza ' } })
    fireEvent.change(school, { target: { value: ' Escola  Azul ' } })
    fireEvent.click(start)
    expect(onConfirm).toHaveBeenCalledWith({ name: 'Ana Souza', school: 'Escola Azul' })
    expect(recentSchools(window.localStorage)[0]).toBe('Escola Azul')
  })

  it('suggests schools used before on this computer', () => {
    rememberSchool(window.localStorage, 'Escola Verde')
    setup()
    expect(document.querySelector('datalist option[value="Escola Verde"]')).not.toBeNull()
  })

  it('cancels without confirming', () => {
    const { onCancel, onConfirm } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
