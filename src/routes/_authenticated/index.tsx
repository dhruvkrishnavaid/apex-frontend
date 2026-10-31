import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({ component: Dashboard })

function Dashboard() {
  return <div className="p-8">Dashboard</div>
}
