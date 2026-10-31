import { requires } from '#/lib/guards'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { auditLogsQuery } from '#/lib/queries'

export const Route = createFileRoute('/_authenticated/audit/')({
  beforeLoad: requires('audit:read'),
  validateSearch: z.object({
    page: z.number().int().min(0).catch(0).default(0),
    method: z.string().optional(),
  }),
  component: AuditPage,
})

function AuditPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isPending, isError } = useQuery(auditLogsQuery(search))

  return (
    <>
      <PageHeader title="Audit log" description="Every change made through the API." />
      <div className="mb-4">
        <Select value={search.method ?? 'all'} onValueChange={(v) => navigate({ search: { method: v === 'all' ? undefined : v, page: 0 } })}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isError ? (
        <EmptyState title="Could not load audit log" />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !data.content.length ? (
        <EmptyState title="No entries" />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{l.userEmail ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <Badge variant="secondary" className="mr-2">{l.method}</Badge>
                      {l.path}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.statusCode >= 400 ? 'destructive' : 'outline'}>{l.statusCode}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.ipAddress ?? '—'}</TableCell>
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
