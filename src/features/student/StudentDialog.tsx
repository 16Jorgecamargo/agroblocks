import { useEffect, useId, useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { recentSchools, rememberSchool } from '@/services/storage/schoolHistory'
import { safeStorage } from '@/services/storage/jsonStorage'
import { cleanText, validateStudent, type StudentInfo } from '@/shared/student'
import './StudentDialog.css'

interface StudentDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (student: StudentInfo) => void
}

export function StudentDialog({ open, onCancel, onConfirm }: StudentDialogProps) {
  const listId = useId()
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [touched, setTouched] = useState({ name: false, school: false })
  const [schools, setSchools] = useState<string[]>([])
  const errors = validateStudent({ name, school })
  const valid = errors.name === null && errors.school === null

  useEffect(() => {
    if (!open) return
    setSchools(recentSchools(safeStorage()))
    setTouched({ name: false, school: false })
  }, [open])

  const confirm = () => {
    if (!valid) return
    const student = { name: cleanText(name), school: cleanText(school) }
    rememberSchool(safeStorage(), student.school)
    onConfirm(student)
  }

  return (
    <GameDialog open={open} title="Quem está jogando?" icon="flag" tone="info" onClose={onCancel}>
      <DialogSection>
        <form
          className="student-dialog"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            confirm()
          }}
        >
          <label className="field">
            <span className="field__label">Nome completo</span>
            <input value={name} maxLength={80} autoComplete="name" autoFocus onChange={(event) => setName(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, name: true }))} aria-invalid={touched.name && errors.name !== null} />
            {touched.name && errors.name && <span className="student-dialog__error">{errors.name}</span>}
          </label>
          <label className="field">
            <span className="field__label">Escola</span>
            <input value={school} maxLength={120} list={listId} onChange={(event) => setSchool(event.target.value)} onBlur={() => setTouched((value) => ({ ...value, school: true }))} aria-invalid={touched.school && errors.school !== null} />
            {touched.school && errors.school && <span className="student-dialog__error">{errors.school}</span>}
          </label>
          <datalist id={listId}>
            {schools.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <p className="student-dialog__notice">
            Seu nome, sua escola, seu progresso nas missões e suas respostas das avaliações serão enviados ao professor para acompanhamento da atividade.
          </p>
          <div className="game-dialog__actions">
            <GameButton tone="secondary" onClick={onCancel}>
              Cancelar
            </GameButton>
            <GameButton tone="primary" type="submit" icon="play" disabled={!valid}>
              Começar
            </GameButton>
          </div>
        </form>
      </DialogSection>
    </GameDialog>
  )
}
