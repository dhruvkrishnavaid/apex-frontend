import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { StatusBadge } from '#/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '#/auth'
import { requires } from '#/lib/guards'
import { transfersQuery } from '#/lib/queries'

const STATUSES = ['REQUESTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']

export const Route = createFileRoute('/_authenticated/transfers/')({
  beforeLoad: requires('transfer:read'),
  validateSearch: z.object({
    page: z.number().int().min(0).catch(0).default(0),
    status: z.string().optional(),
  }),
  component: TransfersPage,
})

function TransfersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { can } = useAuth()
  const { data, isPending, isError } = useQuery(transfersQuery(search))

  return (
    <>
      <PageHeader
        title="Transfers"
        description="Stock moving between warehouses."
        actions={
          can('transfer:create') && (
            <Button asChild>
              <Link to="/transfers/new">
                <Plus /> New transfer
              </Link>
            </Button>
          )
        }
      />
      <div className="mb-4">
        <Select value={search.status ?? 'all'} onValueChange={(v) => navigate({ search: { status: v === 'all' ? undefined : v, page: 0 } })}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replaceAll('_', ' ').toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isError ? (
        <EmptyState title="Could not load transfers" />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !data.content.length ? (
        <EmptyState title="No transfers found" />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      <Link to="/transfers/$transferId" params={{ transferId: t.id }} className="hover:underline">
                        {t.referenceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{t.fromWarehouseCode}</TableCell>
                    <TableCell>{t.toWarehouseCode}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{t.lines.length}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
        </>
      )}
    </>
  )
}
