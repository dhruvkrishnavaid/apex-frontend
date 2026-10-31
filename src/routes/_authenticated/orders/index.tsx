import { requires } from '#/lib/guards'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '#/auth'
import { EmptyState } from '#/components/common/empty-state'
import { PageHeader } from '#/components/common/page-header'
import { Pagination } from '#/components/common/pagination'
import { StatusBadge } from '#/components/common/status-badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ordersQuery } from '#/lib/queries'
import { formatCurrency } from '#/lib/format'

const STATUSES = ['PENDING', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export const Route = createFileRoute('/_authenticated/orders/')({
  beforeLoad: requires('order:read'),
  validateSearch: z.object({
    page: z.number().int().min(0).catch(0).default(0),
    status: z.string().optional(),
  }),
  component: OrdersPage,
})

function OrdersPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { can } = useAuth()
  const { data, isPending, isError } = useQuery(ordersQuery(search))

  return (
    <>
      <PageHeader
        title="Orders"
        description="Sales orders and their fulfilment progress."
        actions={
          can('order:create') && (
            <Button asChild>
              <Link to="/orders/new">
                <Plus /> New order
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
                {s.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isError ? (
        <EmptyState title="Could not load orders" />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : !data.content.length ? (
        <EmptyState title="No orders found" />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      <Link to="/orders/$orderId" params={{ orderId: o.id }} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{o.customerName ?? 'Walk-in'}</TableCell>
                    <TableCell>{o.warehouseCode}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(o.total)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
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
