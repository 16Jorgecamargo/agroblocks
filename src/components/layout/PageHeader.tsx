import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, backTo, backLabel = 'Voltar', actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      {backTo && (
        <Link to={backTo} className="page-header__back">
          <Icon name="back" /> {backLabel}
        </Link>
      )}
      <div className="page-header__titles">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
