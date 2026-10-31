import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { StatusBadge } from '#/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '#/auth'
import { api } from '#/lib/api'
import { requires } from '#/lib/guards'
import { transferQuery } from '#/lib/queries'
import type { Transfer } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/transfers/$transferId')({
  beforeLoad: requires('transfer:read'),
  component: TransferPage,
})

function TransferPage() {
  const { transferId } = Route.useParams()
  const { data, isPending, isError } = useQuery(transferQuery(transferId))
  return (
    <>
      <Link to="/transfers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Transfers
      </Link>
      {isPending ? <Skeleton className="h-48 w-full" /> : isError ? <EmptyState title="Transfer not found" /> : <Detail transfer={data} />}
    </>
  )
}

function Detail({ transfer }: { transfer: Transfer }) {
  const { can } = useAuth()
  const queryClient = useQueryClient()

  const act = useMutation({
    mutationFn: (action: 'dispatch' | 'receive' | 'cancel') => api.post<Transfer>(`/transfers/${transfer.id}/${action}`, action === 'receive' ? {} : undefined),
    onSuccess: (updated, action) => {
      toast.success(action === 'dispatch' ? 'Transfer dispatched' : action === 'receive' ? 'Transfer received' : 'Transfer cancelled')
      queryClient.setQueryData(['transfers', transfer.id], updated)
      queryClient.invalidateQueries({ queryKey: ['transfers', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canUpdate = can('transfer:update')

  return (
    <>
      <PageHeader
        title={transfer.referenceNumber}
        description={`${transfer.fromWarehouseCode} → ${transfer.toWarehouseCode} · ${new Date(transfer.createdAt).toLocaleString()}`}
        actions={<StatusBadge status={transfer.status} />}
      />
      {canUpdate && ['REQUESTED', 'IN_TRANSIT'].includes(transfer.status) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {transfer.status === 'REQUESTED' && <Button disabled={act.isPending} onClick={() => act.mutate('dispatch')}>Dispatch</Button>}
          {transfer.status === 'IN_TRANSIT' && <Button disabled={act.isPending} onClick={() => act.mutate('receive')}>Receive in full</Button>}
          {transfer.status === 'REQUESTED' && (
            <Button variant="outline" className="text-destructive" disabled={act.isPending} onClick={() => confirm('Cancel this transfer?') && act.mutate('cancel')}>
              Cancel
            </Button>
          )}
          {act.isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </div>
      )}
      {transfer.notes && <p className="mb-4 text-sm text-muted-foreground">{transfer.notes}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.receivedQuantity ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
