import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { StatusBadge } from '#/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '#/auth'
import { api } from '#/lib/api'
import { purchaseOrderQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'
import type { PurchaseOrder } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/purchase-orders/$poId')({ component: PurchaseOrderPage })

function PurchaseOrderPage() {
  const { poId } = Route.useParams()
  const { data: po, isPending, isError } = useQuery(purchaseOrderQuery(poId))
  return (
    <>
      <Link to="/purchase-orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Purchase orders
      </Link>
      {isPending ? <Skeleton className="h-48 w-full" /> : isError ? <EmptyState title="Purchase order not found" /> : <Detail po={po} />}
    </>
  )
}

function Detail({ po }: { po: PurchaseOrder }) {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const onError = (e: Error) => toast.error(e.message)

  const act = useMutation({
    mutationFn: (action: 'submit' | 'cancel' | 'close') => api.post(`/purchase-orders/${po.id}/${action}`),
    onSuccess: (_d, action) => {
      toast.success(`Purchase order ${action === 'submit' ? 'submitted' : action === 'cancel' ? 'cancelled' : 'closed'}`)
      refresh()
    },
    onError,
  })

  const receive = useMutation({
    mutationFn: (lines: { lineId: string; quantity: number }[]) => api.post(`/purchase-orders/${po.id}/receive`, { lines }),
    onSuccess: () => {
      toast.success('Goods received')
      setQuantities({})
      refresh()
    },
    onError,
  })

  const receivable = ['ORDERED', 'PARTIALLY_RECEIVED'].includes(po.status) && can('purchase:receive')
  const pending = act.isPending || receive.isPending

  function submitReceipt() {
    const lines = po.lines
      .map((l) => ({ lineId: l.id, quantity: Number(quantities[l.id] ?? 0), max: l.quantityOutstanding }))
      .filter((l) => l.quantity > 0)
    if (!lines.length) return toast.error('Enter a quantity to receive.')
    if (lines.some((l) => !Number.isInteger(l.quantity) || l.quantity > l.max)) return toast.error('Quantities must be whole numbers within the outstanding amount.')
    receive.mutate(lines.map(({ lineId, quantity }) => ({ lineId, quantity })))
  }

  return (
    <>
      <PageHeader
        title={po.poNumber}
        description={`${po.supplierName} → ${po.warehouseCode}${po.expectedDate ? ` · expected ${po.expectedDate}` : ''}`}
        actions={<StatusBadge status={po.status} />}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {po.status === 'DRAFT' && can('purchase:update') && <Button disabled={pending} onClick={() => act.mutate('submit')}>Submit to supplier</Button>}
        {receivable && <Button disabled={pending} onClick={submitReceipt}>Receive entered quantities</Button>}
        {po.status === 'PARTIALLY_RECEIVED' && can('purchase:update') && (
          <Button variant="outline" disabled={pending} onClick={() => confirm('Close with outstanding quantities?') && act.mutate('close')}>Close</Button>
        )}
        {['DRAFT', 'ORDERED'].includes(po.status) && can('purchase:cancel') && (
          <Button variant="outline" className="text-destructive" disabled={pending} onClick={() => confirm('Cancel this purchase order?') && act.mutate('cancel')}>Cancel</Button>
        )}
        {pending && <Loader2 className="size-4 animate-spin self-center text-muted-foreground" />}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {receivable && <TableHead className="w-28 text-right">Receive now</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <p className="font-medium">{l.productName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{l.sku}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantityOrdered}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantityReceived}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(l.unitCost)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(l.lineTotal)}</TableCell>
                  {receivable && (
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={l.quantityOutstanding}
                        disabled={l.quantityOutstanding === 0}
                        value={quantities[l.id] ?? ''}
                        onChange={(e) => setQuantities((q) => ({ ...q, [l.id]: e.target.value }))}
                        aria-label={`Quantity to receive for ${l.sku}`}
                        className="ml-auto w-24 text-right"
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-right text-sm font-semibold tabular-nums">Total {formatCurrency(po.totalAmount)}</p>
        </CardContent>
      </Card>
    </>
  )
}
