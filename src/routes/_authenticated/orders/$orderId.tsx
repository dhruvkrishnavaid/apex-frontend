import { useState } from 'react'
import { requires } from '#/lib/guards'
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
import { orderQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'
import type { Order } from '#/lib/types'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  beforeLoad: requires('order:read'),
 component: OrderPage })

function OrderPage() {
  const { orderId } = Route.useParams()
  const { data: order, isPending, isError } = useQuery(orderQuery(orderId))

  return (
    <>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      {isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <EmptyState title="Order not found" />
      ) : (
        <OrderDetail order={order} />
      )}
    </>
  )
}

function OrderDetail({ order }: { order: Order }) {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')

  const act = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: unknown }) => api.post<Order>(`/orders/${order.id}/${action}`, body),
    onSuccess: (updated, { action }) => {
      toast.success(`Order ${action === 'pick' ? 'picked' : action === 'pack' ? 'packed' : action === 'ship' ? 'shipped' : action === 'deliver' ? 'delivered' : 'cancelled'}`)
      queryClient.setQueryData(['orders', order.id], updated)
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canUpdate = can('order:update')
  const canCancel = can('order:cancel') && ['PENDING', 'PICKING', 'PACKED'].includes(order.status)
  const run = (action: string, body?: unknown) => act.mutate({ action, body })

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`${order.customerName ?? 'Walk-in customer'} · ${order.warehouseCode} · ${new Date(order.createdAt).toLocaleString()}`}
        actions={<StatusBadge status={order.status} />}
      />

      {(canUpdate || canCancel) && !['DELIVERED', 'CANCELLED'].includes(order.status) && (
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {canUpdate && order.status === 'PENDING' && <Button disabled={act.isPending} onClick={() => run('pick')}>Pick all lines</Button>}
            {canUpdate && order.status === 'PICKING' && <Button disabled={act.isPending} onClick={() => run('pack')}>Mark packed</Button>}
            {canUpdate && order.status === 'PACKED' && (
              <>
                <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" aria-label="Carrier" className="sm:w-44" />
                <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" aria-label="Tracking number" className="sm:w-56" />
                <Button disabled={act.isPending} onClick={() => run('ship', { carrier: carrier || undefined, trackingNumber: tracking || undefined })}>
                  Ship
                </Button>
              </>
            )}
            {canUpdate && order.status === 'SHIPPED' && <Button disabled={act.isPending} onClick={() => run('deliver')}>Mark delivered</Button>}
            {canCancel && (
              <Button variant="outline" className="text-destructive sm:ml-auto" disabled={act.isPending} onClick={() => confirm('Cancel this order?') && run('cancel')}>
                Cancel order
              </Button>
            )}
            {act.isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Picked</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <p className="font-medium">{l.productName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{l.sku}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.quantityPicked}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(l.unitPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(l.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="tabular-nums">{formatCurrency(order.taxAmount)}</dd></div>
            <div className="flex justify-between border-t pt-1 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatCurrency(order.total)}</dd></div>
          </dl>
          {(order.trackingNumber || order.carrier) && (
            <p className="mt-4 text-sm text-muted-foreground">
              Shipped via {order.carrier ?? 'carrier'}
              {order.trackingNumber && (
                <>
                  {' '}· tracking <span className="font-mono">{order.trackingNumber}</span>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
