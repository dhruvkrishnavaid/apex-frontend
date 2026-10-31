import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '#/auth'
import { api } from '#/lib/api'
import { alertsQuery, suggestionsQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'

export const Route = createFileRoute('/_authenticated/alerts/')({
  validateSearch: z.object({
    view: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'suggestions']).catch('OPEN').default('OPEN'),
    page: z.number().int().min(0).catch(0).default(0),
  }),
  component: AlertsPage,
})

function AlertsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  return (
    <>
      <PageHeader title="Alerts" description="Low-stock alerts and suggested replenishment." />
      <Tabs className="mb-4" value={search.view} onValueChange={(v) => navigate({ search: { view: v as typeof search.view, page: 0 } })}>
        <TabsList>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="ACKNOWLEDGED">Acknowledged</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          <TabsTrigger value="suggestions">Replenishment</TabsTrigger>
        </TabsList>
      </Tabs>
      {search.view === 'suggestions' ? <Suggestions /> : <AlertList status={search.view} />}
    </>
  )
}

const Loading = () => <Skeleton className="h-48 w-full" />

function AlertList({ status }: { status: string }) {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery(alertsQuery({ page: search.page, status }))

  const acknowledge = useMutation({
    mutationFn: (id: string) => api.post(`/alerts/${id}/acknowledge`),
    onSuccess: () => {
      toast.success('Alert acknowledged')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isError) return <EmptyState title="Could not load alerts" />
  if (isPending) return <Loading />
  if (!data.content.length) return <EmptyState title="Nothing here" description="No alerts with this status." />

  return (
    <>
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Reorder point</TableHead>
              <TableHead>Raised</TableHead>
              {status === 'OPEN' && can('alert:manage') && <TableHead className="w-32" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Badge variant={a.type === 'OUT_OF_STOCK' ? 'destructive' : 'secondary'}>
                    {a.type === 'OUT_OF_STOCK' ? 'Out of stock' : 'Low stock'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{a.productName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{a.sku}</p>
                </TableCell>
                <TableCell>{a.warehouseCode}</TableCell>
                <TableCell className="text-right tabular-nums">{a.availableQuantity}</TableCell>
                <TableCell className="text-right tabular-nums">{a.reorderPoint}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                {status === 'OPEN' && can('alert:manage') && (
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(a.id)}>
                      Acknowledge
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination page={data.page} onChange={(n) => navigate({ search: (s) => ({ ...s, page: n }) })} />
    </>
  )
}

function Suggestions() {
  const { data, isPending, isError } = useQuery(suggestionsQuery)
  if (isError) return <EmptyState title="Could not load suggestions" />
  if (isPending) return <Loading />
  if (!data.length) return <EmptyState title="No replenishment needed" description="Nothing is at or below its reorder point." />
  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Order qty</TableHead>
            <TableHead>Preferred supplier</TableHead>
            <TableHead className="text-right">Est. unit cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((s) => (
            <TableRow key={`${s.variantId}-${s.warehouseId}`}>
              <TableCell>
                <p className="font-medium">{s.productName}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
              </TableCell>
              <TableCell>{s.warehouseCode}</TableCell>
              <TableCell className="text-right tabular-nums">
                {s.availableQuantity} / {s.reorderPoint}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{s.suggestedQuantity}</TableCell>
              <TableCell>{s.preferredSupplierName ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{s.estimatedUnitCost != null ? formatCurrency(s.estimatedUnitCost) : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
