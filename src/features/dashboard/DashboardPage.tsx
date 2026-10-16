import { PageHeader } from '@/components/layout/PageHeader'
import './DashboardPage.css'

interface DashboardPageProps {
  token: string
  onUnauthorized: () => void
  onLogout: () => void
}

export function DashboardPage(props: DashboardPageProps) {
  void props
  return (
    <div className="chrome-page">
      <PageHeader title="Painel do professor" backTo="/" />
    </div>
  )
}
