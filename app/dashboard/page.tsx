import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidate every 30 seconds

export default function DashboardPage() {
  return <Dashboard />
}
